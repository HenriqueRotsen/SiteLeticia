import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { paymentSettingsSchema } from "@/lib/validation/schemas";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { normalizePixCode, parsePixCode } from "@/lib/payments/pix-brcode";

function pixValue(raw) {
  const code = normalizePixCode(raw);
  return code || null;
}

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

  // PIX copia e cola: só grava quando veio no pedido (funciona antes da migração).
  for (const [field, column] of [
    ["consultationPixCode", "consultation_pix_code"],
    ["returnPixCode", "return_pix_code"]
  ]) {
    if (body[field] === undefined) continue;
    const code = pixValue(body[field]);
    if (code && !parsePixCode(code).valid) {
      return NextResponse.json({ message: "Um dos códigos PIX copia e cola está inválido." }, { status: 400 });
    }
    payload[column] = code;
  }

  let result;
  if (existing?.id) {
    result = await auth.ctx.supabase.from("payment_settings").update(payload).eq("id", existing.id).select("*").single();
  } else {
    result = await auth.ctx.supabase.from("payment_settings").insert(payload).select("*").single();
  }

  if (result.error) {
    const pixMissing = /pix_code/.test(String(result.error.message || ""));
    return NextResponse.json(
      {
        message: pixMissing
          ? "Para salvar o PIX copia e cola é preciso rodar o SQL migrate-presencial-pacotes-pix.sql no Supabase."
          : "Não foi possível salvar."
      },
      { status: pixMissing ? 503 : 500 }
    );
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
