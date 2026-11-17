import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { packageInputSchema, packageRow } from "@/lib/packages/schema";

export async function PATCH(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let input;
  try {
    input = packageInputSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Confira nome, quantidade de consultas e preço." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("consultation_packages")
    .update(packageRow(input))
    .eq("id", params.id)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ message: "Não foi possível salvar o pacote." }, { status: error ? 500 : 404 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "package_update",
    resourceType: "consultation_package",
    resourceId: data.id,
    ip: getClientIp(request)
  });
  return NextResponse.json({ package: data });
}

// Apaga o pacote. Quem já comprou mantém a cópia (nome, consultas e preço) no próprio cadastro.
export async function DELETE(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("consultation_packages").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ message: "Não foi possível excluir o pacote." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "package_delete",
    resourceType: "consultation_package",
    resourceId: params.id,
    ip: getClientIp(request)
  });
  return NextResponse.json({ ok: true });
}
