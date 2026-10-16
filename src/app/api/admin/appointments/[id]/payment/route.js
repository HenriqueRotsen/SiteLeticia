import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { listAppointmentDocuments, summarizeDocuments } from "@/lib/payments/documents";

export async function PATCH(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json();
  const paymentStatus = body.paymentStatus;
  if (!["pending", "paid", "waived"].includes(paymentStatus)) {
    return NextResponse.json({ message: "Status inválido." }, { status: 400 });
  }

  if (paymentStatus === "paid") {
    const { documents } = await listAppointmentDocuments(params.id, { withUrls: false });
    const summary = summarizeDocuments(documents);
    if (!summary.hasProof) {
      return NextResponse.json(
        { message: "Anexe ou aguarde o comprovante do paciente antes de validar." },
        { status: 400 }
      );
    }
  }

  const now = new Date().toISOString();
  const updates = {
    payment_status: paymentStatus,
    updated_at: now
  };

  if (paymentStatus === "paid" || paymentStatus === "waived") {
    updates.payment_validated_at = now;
    updates.payment_validated_by = auth.ctx.user.id;
  } else {
    updates.payment_validated_at = null;
    updates.payment_validated_by = null;
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("appointments")
    .update(updates)
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
