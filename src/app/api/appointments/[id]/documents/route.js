import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import {
  listAppointmentDocuments,
  summarizeDocuments,
  uploadAppointmentDocument
} from "@/lib/payments/documents";

async function getOwnAppointment(patientId, appointmentId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function GET(_request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const appointment = await getOwnAppointment(auth.ctx.patient.id, params.id);
  if (!appointment) {
    return NextResponse.json({ message: "Consulta não encontrada." }, { status: 404 });
  }

  const { documents, error } = await listAppointmentDocuments(params.id);
  if (error) {
    return NextResponse.json({ message: "Erro ao listar documentos." }, { status: 500 });
  }

  return NextResponse.json({
    documents,
    summary: summarizeDocuments(documents),
    appointment: {
      id: appointment.id,
      amount_cents: appointment.amount_cents,
      payment_status: appointment.payment_status
    }
  });
}

export async function POST(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const appointment = await getOwnAppointment(auth.ctx.patient.id, params.id);
  if (!appointment) {
    return NextResponse.json({ message: "Consulta não encontrada." }, { status: 404 });
  }

  if (appointment.payment_status === "cancelled") {
    return NextResponse.json({ message: "Consulta cancelada." }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  const result = await uploadAppointmentDocument({
    appointmentId: appointment.id,
    patientId: auth.ctx.patient.id,
    file,
    docType: "payment_proof",
    uploadedByRole: "patient",
    expectedAmountCents: appointment.amount_cents
  });

  if (result.error) {
    return NextResponse.json({ message: result.error }, { status: result.status || 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "payment_proof_upload",
    resourceType: "appointment",
    resourceId: appointment.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ document: result.document });
}
