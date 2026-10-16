import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { mapPresetRow, PRESET_TYPES } from "@/lib/presets/seed";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function PATCH(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const updates = { updated_at: new Date().toISOString() };

  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.content !== undefined) updates.content = body.content || {};
  if (body.sortOrder !== undefined) updates.sort_order = Number(body.sortOrder) || 0;
  if (body.active !== undefined) updates.active = Boolean(body.active);
  if (body.type !== undefined) {
    if (!PRESET_TYPES.includes(body.type)) {
      return NextResponse.json({ message: "Tipo inválido." }, { status: 400 });
    }
    updates.type = body.type;
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("prescription_presets")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: "Erro ao atualizar preset." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "preset_update",
    resourceType: "prescription_preset",
    resourceId: params.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ preset: mapPresetRow(data) });
}

export async function DELETE(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("prescription_presets").delete().eq("id", params.id);

  if (error) {
    return NextResponse.json({ message: "Erro ao excluir preset." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "preset_delete",
    resourceType: "prescription_preset",
    resourceId: params.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true });
}
