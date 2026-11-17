import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { attachPhotoUrls } from "@/lib/storage/signed-url";

/** URLs curtas: a nutricionista recarrega a lista para gerar novas. */
const PHOTO_URL_TTL_SECONDS = 5 * 60;

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const patientId = params?.id;
  if (!patientId) {
    return NextResponse.json({ message: "Paciente obrigatório." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const [{ data: patient }, { data: rows, error }] = await Promise.all([
    supabase.from("patients").select("id, full_name").eq("id", patientId).maybeSingle(),
    supabase
      .from("progress_photos")
      .select("id, patient_id, storage_path, taken_at, caption, visibility, created_at")
      .eq("patient_id", patientId)
      .order("taken_at", { ascending: false })
  ]);

  if (!patient) {
    return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
  }

  if (error) {
    console.error("Progress photos GET (admin) failed:", error);
    return NextResponse.json({ message: "Erro ao carregar fotos." }, { status: 500 });
  }

  const withUrls = await attachPhotoUrls(rows || [], { ttlSeconds: PHOTO_URL_TTL_SECONDS });
  // O caminho no storage não sai da API; o front só precisa da URL assinada.
  const photos = withUrls.map(({ storage_path: _path, ...photo }) => photo);

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "progress_photos_view",
    resourceType: "patient",
    resourceId: patientId,
    ip: getClientIp(request)
  });

  return NextResponse.json(
    {
      patient: { id: patient.id, full_name: patient.full_name },
      photos,
      expiresInSeconds: PHOTO_URL_TTL_SECONDS
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
