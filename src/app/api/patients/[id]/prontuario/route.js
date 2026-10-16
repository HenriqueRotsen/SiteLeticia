import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const MAX_BODY_CHARS = 100_000;

function readBodyText(body = {}) {
  return String(body.bodyText ?? body.body_text ?? body.bodyMd ?? body.body_md ?? "");
}

export async function GET(_request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data, error } = await auth.ctx.supabase
    .from("clinical_records")
    .select("*")
    .eq("patient_id", params.id)
    .order("session_at", { ascending: false });

  if (error) {
    console.error("Clinical records list failed:", error);
    return NextResponse.json({ message: "Erro ao carregar prontuário." }, { status: 500 });
  }

  const records = (data || []).map((record) => ({
    ...record,
    body_text: record.body_text ?? record.body_md ?? ""
  }));

  return NextResponse.json({ records });
}

export async function POST(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const title = String(body.title || "").trim() || null;
  const bodyText = readBodyText(body);
  const appointmentId = body.appointmentId || body.appointment_id || null;
  const sessionAtRaw = body.sessionAt || body.session_at;

  if (!bodyText.trim()) {
    return NextResponse.json({ message: "Cole o texto do prontuário." }, { status: 400 });
  }

  if (bodyText.length > MAX_BODY_CHARS) {
    return NextResponse.json({ message: "Texto muito longo." }, { status: 400 });
  }

  const sessionAt = sessionAtRaw ? new Date(sessionAtRaw) : new Date();
  if (Number.isNaN(sessionAt.getTime())) {
    return NextResponse.json({ message: "Data da sessão inválida." }, { status: 400 });
  }

  const { data: record, error } = await auth.ctx.supabase
    .from("clinical_records")
    .insert({
      patient_id: params.id,
      appointment_id: appointmentId || null,
      session_at: sessionAt.toISOString(),
      title,
      body_text: bodyText,
      notes: null,
      storage_path: null,
      mime_type: "text/plain",
      file_name: null,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error || !record) {
    console.error("Clinical record insert failed:", error);
    return NextResponse.json({ message: "Erro ao salvar prontuário." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "clinical_record_create",
    resourceType: "clinical_record",
    resourceId: record.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    record: { ...record, body_text: record.body_text ?? bodyText }
  });
}

export async function PATCH(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const recordId = body.recordId;
  if (!recordId) {
    return NextResponse.json({ message: "recordId obrigatório." }, { status: 400 });
  }

  const updates = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = String(body.title || "").trim() || null;

  const hasBody =
    body.bodyText !== undefined ||
    body.body_text !== undefined ||
    body.bodyMd !== undefined ||
    body.body_md !== undefined;
  if (hasBody) {
    const bodyText = readBodyText(body);
    if (!bodyText.trim()) {
      return NextResponse.json({ message: "Cole o texto do prontuário." }, { status: 400 });
    }
    if (bodyText.length > MAX_BODY_CHARS) {
      return NextResponse.json({ message: "Texto muito longo." }, { status: 400 });
    }
    updates.body_text = bodyText;
  }

  if (body.sessionAt !== undefined || body.session_at !== undefined) {
    const sessionAt = new Date(body.sessionAt ?? body.session_at);
    if (Number.isNaN(sessionAt.getTime())) {
      return NextResponse.json({ message: "Data da sessão inválida." }, { status: 400 });
    }
    updates.session_at = sessionAt.toISOString();
  }
  if (body.appointmentId !== undefined || body.appointment_id !== undefined) {
    updates.appointment_id = body.appointmentId ?? body.appointment_id ?? null;
  }

  const { data: record, error } = await auth.ctx.supabase
    .from("clinical_records")
    .update(updates)
    .eq("id", recordId)
    .eq("patient_id", params.id)
    .select("*")
    .single();

  if (error || !record) {
    return NextResponse.json({ message: "Erro ao atualizar prontuário." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "clinical_record_update",
    resourceType: "clinical_record",
    resourceId: recordId,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    record: { ...record, body_text: record.body_text ?? record.body_md ?? "" }
  });
}
