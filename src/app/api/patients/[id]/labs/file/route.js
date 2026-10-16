import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function labsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_LABS || "lab-reports";
}

export async function GET(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const reportId = new URL(request.url).searchParams.get("id");
  if (!reportId) {
    return NextResponse.json({ message: "Laudo obrigatório." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: report, error } = await supabase
    .from("lab_reports")
    .select("id, patient_id, storage_path")
    .eq("id", reportId)
    .eq("patient_id", params.id)
    .maybeSingle();

  if (error || !report?.storage_path) {
    return NextResponse.json({ message: "Laudo não encontrado." }, { status: 404 });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(labsBucket())
    .download(report.storage_path);

  if (downloadError || !file) {
    return NextResponse.json({ message: "Não foi possível abrir o PDF." }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(buffer.length),
      "Content-Disposition": `inline; filename="exame-${report.id}.pdf"`,
      "Cache-Control": "private, max-age=60"
    }
  });
}
