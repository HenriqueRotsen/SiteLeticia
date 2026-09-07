import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function PATCH(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const status = body.status;
  if (!["active", "archived", "draft"].includes(status)) {
    return NextResponse.json({ message: "Status inválido." }, { status: 400 });
  }

  const { data: existing, error: existingError } = await auth.ctx.supabase
    .from("diet_plans")
    .select("id, patient_id, status")
    .eq("id", params.planId)
    .eq("patient_id", params.id)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ message: "Plano não encontrado." }, { status: 404 });
  }

  if (status === "active") {
    await auth.ctx.supabase
      .from("diet_plans")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("patient_id", params.id)
      .eq("status", "active")
      .neq("id", params.planId);
  }

  const { data: plan, error } = await auth.ctx.supabase
    .from("diet_plans")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.planId)
    .eq("patient_id", params.id)
    .select("*")
    .single();

  if (error || !plan) {
    console.error("Diet plan status update failed:", error);
    return NextResponse.json({ message: "Erro ao atualizar plano." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: status === "archived" ? "diet_plan_deactivate" : "diet_plan_status_update",
    resourceType: "diet_plan",
    resourceId: params.planId,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true, plan });
}

export async function DELETE(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data: existing, error: existingError } = await auth.ctx.supabase
    .from("diet_plans")
    .select("id")
    .eq("id", params.planId)
    .eq("patient_id", params.id)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ message: "Plano não encontrado." }, { status: 404 });
  }

  const { error } = await auth.ctx.supabase
    .from("diet_plans")
    .delete()
    .eq("id", params.planId)
    .eq("patient_id", params.id);

  if (error) {
    console.error("Diet plan delete failed:", error);
    return NextResponse.json({ message: "Erro ao excluir plano." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "diet_plan_delete",
    resourceType: "diet_plan",
    resourceId: params.planId,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true });
}
