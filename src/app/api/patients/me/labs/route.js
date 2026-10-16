import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ALLOWED_PDF_TYPES, MAX_PDF_BYTES } from "@/lib/constants";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { createStorageSignedUrl } from "@/lib/storage/signed-url";

const PENDING_ANALYSIS = "Analisando automaticamente…";

function labsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_LABS || "lab-reports";
}

async function loadPatientExamOrders(supabase, patientId) {
  const { data: plans } = await supabase
    .from("diet_plans")
    .select("id, status, title, diet_exam_orders(*)")
    .eq("patient_id", patientId)
    .in("status", ["active", "archived"])
    .order("created_at", { ascending: false });

  const active = (plans || []).find((plan) => plan.status === "active") || (plans || [])[0] || null;
  return (active?.diet_exam_orders || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

function toPatientReport(report, fileUrl) {
  const analyzing =
    !report.ai_interpretation ||
    report.interpretation_summary === PENDING_ANALYSIS ||
    String(report.interpretation_summary || "").startsWith("Analisando automaticamente");

  const base = {
    id: report.id,
    status: report.status,
    created_at: report.created_at,
    uploaded_by: report.uploaded_by,
    published_by: report.published_by,
    reviewed_at: report.reviewed_at,
    analyzing: report.status === "draft" && analyzing,
    file_url: `/api/patients/me/labs/file?id=${encodeURIComponent(report.id)}`,
    signed_url: fileUrl
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

  const examOrders = await loadPatientExamOrders(supabase, auth.ctx.patient.id);

  return NextResponse.json({ reports, examOrders });
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

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, parsed.buffer, {
    contentType: "application/pdf"
  });

  if (uploadError) {
    return NextResponse.json({ message: "Falha no upload." }, { status: 500 });
  }

  const { data: report, error } = await supabase
    .from("lab_reports")
    .insert({
      patient_id: patientId,
      storage_path: path,
      extracted_text: "",
      ai_interpretation: null,
      interpretation_summary: PENDING_ANALYSIS,
      uploaded_by: "patient",
      status: "draft"
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao salvar laudo." }, { status: 500 });

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "lab_upload_patient",
    resourceType: "lab_report",
    resourceId: report.id,
    ip: getClientIp(request)
  });

  const fileUrl = await createStorageSignedUrl(bucket, path);
  const examOrders = await loadPatientExamOrders(supabase, patientId);
  return NextResponse.json({
    report: toPatientReport(report, fileUrl),
    examOrders,
    needsAnalysis: true
  });
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

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, parsed.buffer, {
    contentType: "application/pdf"
  });

  if (uploadError) {
    return NextResponse.json({ message: "Falha no upload." }, { status: 500 });
  }

  await supabase.from("lab_results").delete().eq("report_id", reportId);

  const { data: report, error } = await supabase
    .from("lab_reports")
    .update({
      storage_path: path,
      extracted_text: "",
      ai_interpretation: null,
      interpretation_summary: PENDING_ANALYSIS
    })
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao atualizar laudo." }, { status: 500 });

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
  const examOrders = await loadPatientExamOrders(supabase, patientId);
  return NextResponse.json({
    report: toPatientReport(report, fileUrl),
    examOrders,
    needsAnalysis: true
  });
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
