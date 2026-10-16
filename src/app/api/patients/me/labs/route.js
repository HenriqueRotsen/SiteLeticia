import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractLabReportFromPdfBuffer } from "@/lib/labs/extract";
import { ALLOWED_PDF_TYPES, MAX_PDF_BYTES } from "@/lib/constants";
import { compressPdfBuffer } from "@/lib/media/compress-pdf";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { labReportPatchSchema } from "@/lib/validation/schemas";

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("lab_reports")
    .select("*, lab_results(*)")
    .eq("patient_id", auth.ctx.patient.id)
    .order("created_at", { ascending: false });

  const reports = (data || []).filter(
    (report) => report.status === "published" || report.uploaded_by === "patient"
  );

  return NextResponse.json({ reports });
}

export async function POST(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "PDF obrigatório." }, { status: 400 });
  }

  if (!ALLOWED_PDF_TYPES.includes(file.type)) {
    return NextResponse.json({ message: "Apenas PDF permitido." }, { status: 400 });
  }

  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ message: "PDF muito grande (máx. 10MB)." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const patientId = auth.ctx.patient.id;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET_LABS || "lab-reports";
  const path = `${patientId}/${randomUUID()}.pdf`;
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  let extraction;
  try {
    extraction = await extractLabReportFromPdfBuffer(originalBuffer);
  } catch {
    extraction = {
      extractedText: "",
      results: [],
      interpretationSummary: "Não foi possível extrair automaticamente."
    };
  }

  let storedBuffer = originalBuffer;
  try {
    const compressed = await compressPdfBuffer(originalBuffer);
    storedBuffer = compressed.buffer;
  } catch {
    storedBuffer = originalBuffer;
  }

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, storedBuffer, {
    contentType: "application/pdf"
  });

  if (uploadError) {
    return NextResponse.json({ message: "Falha no upload." }, { status: 500 });
  }

  const aiText = extraction.interpretationSummary;

  const { data: report, error } = await supabase
    .from("lab_reports")
    .insert({
      patient_id: patientId,
      storage_path: path,
      extracted_text: extraction.extractedText,
      ai_interpretation: aiText,
      interpretation_summary: aiText,
      uploaded_by: "patient",
      status: "draft"
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao salvar laudo." }, { status: 500 });

  if (extraction.results?.length) {
    await supabase.from("lab_results").insert(
      extraction.results.map((r) => ({
        report_id: report.id,
        marker_key: r.marker_key,
        marker_name: r.marker_name,
        value: r.value,
        value_text: r.value_text,
        unit: r.unit,
        ref_min: r.ref_min,
        ref_max: r.ref_max,
        flag: r.flag
      }))
    );
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "lab_upload_patient",
    resourceType: "lab_report",
    resourceId: report.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ report, results: extraction.results || [] });
}

export async function PATCH(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  try {
    const body = labReportPatchSchema.parse(await request.json());
    const updates = {};

    if (body.interpretationSummary != null) {
      updates.interpretation_summary = body.interpretationSummary;
    }

    if (body.status === "published") {
      updates.status = "published";
      updates.published_by = "patient";
      updates.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await auth.ctx.supabase
      .from("lab_reports")
      .update(updates)
      .eq("id", body.reportId)
      .eq("patient_id", auth.ctx.patient.id)
      .select("*, lab_results(*)")
      .single();

    if (error) return NextResponse.json({ message: "Erro ao atualizar." }, { status: 500 });
    return NextResponse.json({ report: data });
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
}
