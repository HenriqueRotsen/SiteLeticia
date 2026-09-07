import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function PATCH(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { paymentStatus } = await request.json();
  if (!["pending", "paid", "waived"].includes(paymentStatus)) {
    return NextResponse.json({ message: "Status inválido." }, { status: 400 });
  }

  const { data, error } = await auth.ctx.supabase
    .from("appointments")
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao atualizar." }, { status: 500 });

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "appointment_payment_update",
    resourceType: "appointment",
    resourceId: params.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ appointment: data });
}
