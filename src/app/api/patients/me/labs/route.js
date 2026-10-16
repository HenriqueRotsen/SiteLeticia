import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractLabReportFromPdfBuffer } from "@/lib/labs/extract";
import { ALLOWED_PDF_TYPES, MAX_PDF_BYTES } from "@/lib/constants";
import { compressPdfBuffer } from "@/lib/media/compress-pdf";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { createStorageSignedUrl } from "@/lib/storage/signed-url";

function labsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_LABS || "lab-reports";
}

function toPatientReport(report, fileUrl) {
  const base = {
    id: report.id,
    status: report.status,
    created_at: report.created_at,
    uploaded_by: report.uploaded_by,
    published_by: report.published_by,
    reviewed_at: report.reviewed_at,
    file_url: fileUrl
  };

  if (report.status !== "published") {
    return base;
  }

  return {
    ...base,
    interpretation_summary: report.interpretation_summary,
    lab_results: report.lab_results || []
  };
}

async function extractAndStorePdf(originalBuffer) {
  let extraction;
  try {
    extraction = await extractLabReportFromPdfBuffer(originalBuffer);
  } catch {
    extraction = {
      extractedText: "",
      results: [],
      interpretationSummary:
        "Não foi possível extrair automaticamente. Revise o PDF manualmente."
    };
  }

  let storedBuffer = originalBuffer;
  try {
    const compressed = await compressPdfBuffer(originalBuffer);
    storedBuffer = compressed.buffer;
  } catch {
    storedBuffer = originalBuffer;
  }

  return { extraction, storedBuffer };
}

async function readPdfFromForm(formData) {
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return { error: NextResponse.json({ message: "PDF obrigatório." }, { status: 400 }) };
  }

  if (!ALLOWED_PDF_TYPES.includes(file.type)) {
    return { error: NextResponse.json({ message: "Apenas PDF permitido." }, { status: 400 }) };
  }

  if (file.size > MAX_PDF_BYTES) {
    return { error: NextResponse.json({ message: "PDF muito grande (máx. 10MB)." }, { status: 400 }) };
  }

  return { file, buffer: Buffer.from(await file.arrayBuffer()) };
}

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  // Usa admin: RLS do paciente só liberava status=published e escondia os próprios envios em draft.
  const supabase = createSupabaseAdmin();
  const bucket = labsBucket();
  const { data } = await supabase
    .from("lab_reports")
    .select("*, lab_results(*)")
    .eq("patient_id", auth.ctx.patient.id)
    .order("created_at", { ascending: false });

  const visible = (data || []).filter(
    (report) => report.status === "published" || report.uploaded_by === "patient"
  );

  const reports = await Promise.all(
    visible.map(async (report) => {
      const fileUrl = await createStorageSignedUrl(bucket, report.storage_path);
      return toPatientReport(report, fileUrl);
    })
  );

  return NextResponse.json({ reports });
}

export async function POST(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const parsed = await readPdfFromForm(formData);
  if (parsed.error) return parsed.error;

  const supabase = createSupabaseAdmin();
  const patientId = auth.ctx.patient.id;
  const bucket = labsBucket();
  const path = `${patientId}/${randomUUID()}.pdf`;
  const { extraction, storedBuffer } = await extractAndStorePdf(parsed.buffer);

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

  const fileUrl = await createStorageSignedUrl(bucket, path);
  return NextResponse.json({ report: toPatientReport(report, fileUrl) });
}

/** Substitui o PDF de um envio ainda em rascunho. */
export async function PUT(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const reportId = formData.get("reportId")?.toString();
  if (!reportId) {
    return NextResponse.json({ message: "Laudo obrigatório." }, { status: 400 });
  }

  const parsed = await readPdfFromForm(formData);
  if (parsed.error) return parsed.error;

  const supabase = createSupabaseAdmin();
  const patientId = auth.ctx.patient.id;
  const bucket = labsBucket();

  const { data: existing, error: existingError } = await supabase
    .from("lab_reports")
    .select("id, storage_path, status, uploaded_by")
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ message: "Laudo não encontrado." }, { status: 404 });
  }

  if (existing.uploaded_by !== "patient" || existing.status !== "draft") {
    return NextResponse.json(
      { message: "Só é possível alterar envios ainda aguardando revisão." },
      { status: 400 }
    );
  }

  const path = `${patientId}/${randomUUID()}.pdf`;
  const { extraction, storedBuffer } = await extractAndStorePdf(parsed.buffer);

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, storedBuffer, {
    contentType: "application/pdf"
  });

  if (uploadError) {
    return NextResponse.json({ message: "Falha no upload." }, { status: 500 });
  }

  const aiText = extraction.interpretationSummary;

  const { data: report, error } = await supabase
    .from("lab_reports")
    .update({
      storage_path: path,
      extracted_text: extraction.extractedText,
      ai_interpretation: aiText,
      interpretation_summary: aiText
    })
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao atualizar laudo." }, { status: 500 });

  await supabase.from("lab_results").delete().eq("report_id", reportId);

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

  if (existing.storage_path && existing.storage_path !== path) {
    await supabase.storage.from(bucket).remove([existing.storage_path]);
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "lab_replace_patient",
    resourceType: "lab_report",
    resourceId: report.id,
    ip: getClientIp(request)
  });

  const fileUrl = await createStorageSignedUrl(bucket, path);
  return NextResponse.json({ report: toPatientReport(report, fileUrl) });
}

export async function DELETE(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const reportId = new URL(request.url).searchParams.get("id");
  if (!reportId) {
    return NextResponse.json({ message: "Laudo obrigatório." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const patientId = auth.ctx.patient.id;
  const bucket = labsBucket();

  const { data: existing, error: existingError } = await supabase
    .from("lab_reports")
    .select("id, storage_path, status, uploaded_by")
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ message: "Laudo não encontrado." }, { status: 404 });
  }

  if (existing.uploaded_by !== "patient" || existing.status !== "draft") {
    return NextResponse.json(
      { message: "Só é possível excluir envios ainda aguardando revisão." },
      { status: 400 }
    );
  }

  await supabase.from("lab_results").delete().eq("report_id", reportId);
  const { error } = await supabase.from("lab_reports").delete().eq("id", reportId);

  if (error) return NextResponse.json({ message: "Erro ao excluir laudo." }, { status: 500 });

  if (existing.storage_path) {
    await supabase.storage.from(bucket).remove([existing.storage_path]);
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "lab_delete_patient",
    resourceType: "lab_report",
    resourceId: reportId,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true });
}
