import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { cancelAppointmentRecord } from "@/lib/scheduling/cancel-appointment";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { consultationPaymentOptions, isMissingPaymentColumn, pickOption } from "@/lib/payments/card";

// Troca PIX ↔ cartão enquanto o pagamento está pendente (o valor muda junto).
async function switchPaymentMethod({ supabase, auth, appointmentId, method, request }) {
  const { data: appointment } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("patient_id", auth.ctx.patient.id)
    .maybeSingle();
  if (!appointment) {
    return NextResponse.json({ message: "Consulta não encontrada." }, { status: 404 });
  }
  if (appointment.status !== "scheduled" || appointment.payment_status !== "pending" || appointment.patient_package_id) {
    return NextResponse.json({ message: "O pagamento desta consulta não pode mais ser alterado." }, { status: 400 });
  }

  const { data: settings } = await supabase.from("payment_settings").select("*").limit(1).maybeSingle();
  const option = pickOption(consultationPaymentOptions(settings || {}), method);
  if (option.method !== method) {
    return NextResponse.json({ message: "Essa forma de pagamento não está disponível." }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("appointments")
    .update({ payment_method: option.method, amount_cents: option.cents, updated_at: new Date().toISOString() })
    .eq("id", appointment.id)
    .select("*")
    .single();
  if (error) {
    return NextResponse.json(
      { message: isMissingPaymentColumn(error) ? "Pagamento no cartão ainda não está disponível." : "Não foi possível alterar." },
      { status: 500 }
    );
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "appointment_payment_method",
    resourceType: "appointment",
    resourceId: appointment.id,
    ip: getClientIp(request)
  });
  return NextResponse.json({ appointment: updated });
}

export async function PATCH(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const appointmentId = params.id;
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.paymentMethod === "pix" || body.paymentMethod === "card") {
    return switchPaymentMethod({
      supabase: createSupabaseAdmin(),
      auth,
      appointmentId,
      method: body.paymentMethod,
      request
    });
  }

  if (body.status !== "cancelled") {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("patient_id", auth.ctx.patient.id)
    .maybeSingle();

  if (error || !appointment) {
    return NextResponse.json({ message: "Consulta não encontrada." }, { status: 404 });
  }

  if (appointment.status === "cancelled") {
    return NextResponse.json({ appointment });
  }

  if (appointment.status !== "scheduled") {
    return NextResponse.json(
      { message: "Só é possível cancelar consultas agendadas." },
      { status: 400 }
    );
  }

  try {
    const updated = await cancelAppointmentRecord(appointment);
    await writeAuditLog({
      actorId: auth.ctx.user.id,
      action: "appointment_cancel",
      resourceType: "appointment",
      resourceId: appointment.id,
      ip: getClientIp(request)
    });
    return NextResponse.json({ appointment: updated });
  } catch (err) {
    console.error("Patient cancel failed:", err?.message || err);
    return NextResponse.json({ message: "Não foi possível cancelar a consulta." }, { status: 500 });
  }
}
