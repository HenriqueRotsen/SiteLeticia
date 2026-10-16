import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { paymentSettingsSchema } from "@/lib/validation/schemas";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase.from("payment_settings").select("*").limit(1).maybeSingle();
  return NextResponse.json({ settings: data });
}

export async function PUT(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = paymentSettingsSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const { data: existing } = await auth.ctx.supabase.from("payment_settings").select("id").limit(1).maybeSingle();

  const payload = {
    consultation_price_cents: body.consultationPriceCents,
    return_price_cents: body.returnPriceCents ?? null,
    instructions: body.instructions || "",
    cancellation_policy: body.cancellationPolicy || "",
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing?.id) {
    result = await auth.ctx.supabase.from("payment_settings").update(payload).eq("id", existing.id).select("*").single();
  } else {
    result = await auth.ctx.supabase.from("payment_settings").insert(payload).select("*").single();
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "payment_settings_update",
    resourceType: "payment_settings",
    resourceId: result.data?.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ settings: result.data });
}
