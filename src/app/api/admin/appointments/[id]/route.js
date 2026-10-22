import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { cancelAppointmentRecord } from "@/lib/scheduling/cancel-appointment";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function PATCH(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const appointmentId = params.id;
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.status !== "cancelled") {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
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
    console.error("Admin cancel failed:", err?.message || err);
    return NextResponse.json({ message: "Não foi possível cancelar a consulta." }, { status: 500 });
  }
}
