import { NextResponse } from "next/server";
import { z } from "zod";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({ paymentStatus: z.enum(["pending", "paid", "cancelled"]) });

// Valida o pagamento do pacote (libera os créditos) ou cancela.
export async function PATCH(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Ação inválida." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("patient_packages")
    .update({
      payment_status: body.paymentStatus,
      paid_at: body.paymentStatus === "paid" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq("id", params.id)
    .select("*")
    .maybeSingle();
  if (error || !data) {
    return NextResponse.json({ message: "Não foi possível atualizar o pacote." }, { status: error ? 500 : 404 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: `patient_package_${body.paymentStatus}`,
    resourceType: "patient_package",
    resourceId: data.id,
    ip: getClientIp(request)
  });
  return NextResponse.json({ package: data });
}
