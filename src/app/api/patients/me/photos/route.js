import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ALLOWED_IMAGE_TYPES, MAX_PHOTO_BYTES } from "@/lib/constants";
import { compressImageBuffer } from "@/lib/media/compress-image";
import { attachPhotoUrls, createStorageSignedUrl } from "@/lib/storage/signed-url";

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("progress_photos")
    .select("*")
    .eq("patient_id", auth.ctx.patient.id)
    .order("taken_at", { ascending: false });

  const photos = await attachPhotoUrls(data || []);
  return NextResponse.json({ photos });
}

export async function POST(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const caption = formData.get("caption")?.toString() || "";

  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "Arquivo obrigatório." }, { status: 400 });
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ message: "Formato de imagem não permitido." }, { status: 400 });
  }

  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ message: "Imagem muito grande (máx. 5MB)." }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET_PHOTOS || "progress-photos";
  const originalBuffer = Buffer.from(await file.arrayBuffer());
  let compressed;

  try {
    compressed = await compressImageBuffer(originalBuffer, file.type);
  } catch {
    return NextResponse.json({ message: "Não foi possível processar a imagem." }, { status: 400 });
  }

  const path = `${auth.ctx.patient.id}/${randomUUID()}${compressed.extension}`;
  const supabase = createSupabaseAdmin();

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, compressed.buffer, {
    contentType: compressed.contentType,
    upsert: false
  });

  if (uploadError) {
    return NextResponse.json({ message: "Falha no upload." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("progress_photos")
    .insert({
      patient_id: auth.ctx.patient.id,
      storage_path: path,
      caption,
      visibility: "patient"
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao registrar foto." }, { status: 500 });

  const url = await createStorageSignedUrl(bucket, path);
  return NextResponse.json({ photo: { ...data, url } });
}
