import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import {
  listAppointmentDocuments,
  summarizeDocuments,
  uploadAppointmentDocument
} from "@/lib/payments/documents";

async function getAppointment(appointmentId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("appointments")
    .select("*, patients(full_name)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function GET(_request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const appointment = await getAppointment(params.id);
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
    appointment
  });
}

export async function POST(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const appointment = await getAppointment(params.id);
  if (!appointment) {
    return NextResponse.json({ message: "Consulta não encontrada." }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const docTypeRaw = String(formData.get("docType") || "invoice");
  const docType = docTypeRaw === "payment_proof" ? "payment_proof" : "invoice";

  const { documents } = await listAppointmentDocuments(params.id, { withUrls: false });
  const summary = summarizeDocuments(documents);

  const result = await uploadAppointmentDocument({
    appointmentId: appointment.id,
    patientId: appointment.patient_id,
    file,
    docType,
    uploadedByRole: "nutritionist",
    expectedAmountCents: appointment.amount_cents,
    proofAmountCents: summary.latestProof?.extracted_amount_cents ?? null
  });

  if (result.error) {
    return NextResponse.json({ message: result.error }, { status: result.status || 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: docType === "invoice" ? "invoice_upload" : "payment_proof_upload_admin",
    resourceType: "appointment",
    resourceId: appointment.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ document: result.document });
}
