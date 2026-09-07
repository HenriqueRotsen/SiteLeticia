import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractLabReportFromPdfBuffer } from "@/lib/labs/extract";
import { ALLOWED_PDF_TYPES, MAX_PDF_BYTES } from "@/lib/constants";
import { compressPdfBuffer } from "@/lib/media/compress-pdf";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { hashCpf, isValidCpf } from "@/lib/cpf";
import { labReportPatchSchema, patientStubSchema } from "@/lib/validation/schemas";

async function ensurePatient(supabase, patientId, stub) {
  if (patientId) {
    const { data } = await supabase.from("patients").select("id").eq("id", patientId).maybeSingle();
    if (data) return data.id;
  }

  if (!stub) throw new Error("Paciente não informado");

  const parsed = patientStubSchema.parse(stub);
  const { data: existing } = await supabase.from("patients").select("id").eq("cpf", parsed.cpf).maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("patients")
    .insert({
      cpf: parsed.cpf,
      cpf_hash: hashCpf(parsed.cpf),
      full_name: parsed.fullName,
      phone: parsed.phone.replace(/\D/g, ""),
      goal: parsed.goal
    })
    .select("id")
    .single();

  return created.id;
}

export async function POST(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const cpf = formData.get("cpf")?.toString();
  const fullName = formData.get("fullName")?.toString();
  const phone = formData.get("phone")?.toString();
  const goal = formData.get("goal")?.toString();

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
  let patientId = params.id !== "by-cpf" ? params.id : null;

  try {
    patientId = await ensurePatient(supabase, patientId, cpf ? { cpf, fullName, phone, goal } : null);
  } catch (error) {
    return NextResponse.json({ message: error.message || "Paciente inválido." }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET_LABS || "lab-reports";
  const path = `${patientId}/${randomUUID()}.pdf`;
  const originalBuffer = Buffer.from(await file.arrayBuffer());

  let extraction;
  try {
    extraction = await extractLabReportFromPdfBuffer(originalBuffer);
  } catch {
    extraction = { extractedText: "", results: [], interpretationSummary: "Não foi possível extrair automaticamente." };
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
      uploaded_by: "nutritionist",
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
    action: "lab_upload",
    resourceType: "lab_report",
    resourceId: report.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ report, results: extraction.results || [] });
}

export async function GET(_request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("lab_reports")
    .select("*, lab_results(*)")
    .eq("patient_id", params.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ reports: data || [] });
}

export async function PATCH(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  try {
    const body = labReportPatchSchema.parse(await request.json());
    const updates = {};

    if (body.interpretationSummary != null) {
      updates.interpretation_summary = body.interpretationSummary;
    }

    if (body.status) {
      updates.status = body.status;
      if (body.status === "published") {
        updates.published_by = body.publishedBy || "nutritionist";
        updates.reviewed_at = new Date().toISOString();
      }
    }

    const { data, error } = await auth.ctx.supabase
      .from("lab_reports")
      .update(updates)
      .eq("id", body.reportId)
      .eq("patient_id", params.id)
      .select("*, lab_results(*)")
      .single();

    if (error) return NextResponse.json({ message: "Erro ao atualizar." }, { status: 500 });
    return NextResponse.json({ report: data });
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }
}
