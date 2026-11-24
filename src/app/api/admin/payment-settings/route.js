import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { paymentSettingsSchema } from "@/lib/validation/schemas";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { normalizePixCode, parsePixCode } from "@/lib/payments/pix-brcode";
import { CARD_MIGRATION_MESSAGE, isMissingPaymentColumn, normalizePaymentLink } from "@/lib/payments/card";

function pixValue(raw) {
  const code = normalizePixCode(raw);
  return code || null;
}

// Colunas criadas por migrate-pagamento-cartao.sql.
const CARD_COLUMNS = new Set([
  "card_fee_percent",
  "card_max_installments",
  "consultation_card_price_cents",
  "consultation_card_link",
  "consultation_card_fee_percent",
  "consultation_card_installments"
]);

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
    instructions: body.instructions || "",
    cancellation_policy: body.cancellationPolicy || "",
    updated_at: new Date().toISOString()
  };

  // PIX copia e cola: só grava quando veio no pedido (funciona antes da migração).
  for (const [field, column] of [["consultationPixCode", "consultation_pix_code"]]) {
    if (body[field] === undefined) continue;
    const code = pixValue(body[field]);
    if (code && !parsePixCode(code).valid) {
      return NextResponse.json({ message: "Um dos códigos PIX copia e cola está inválido." }, { status: 400 });
    }
    payload[column] = code;
  }

  // Cartão de crédito (link de pagamento com a taxa repassada).
  if (body.consultationCardLink !== undefined) {
    const link = normalizePaymentLink(body.consultationCardLink);
    if (String(body.consultationCardLink || "").trim() && !link) {
      return NextResponse.json({ message: "O link do cartão precisa começar com https://." }, { status: 400 });
    }
    payload.consultation_card_link = link;
  }
  if (body.consultationCardPriceCents !== undefined) {
    payload.consultation_card_price_cents = body.consultationCardPriceCents || null;
  }
  if (body.consultationCardFeePercent !== undefined) payload.consultation_card_fee_percent = body.consultationCardFeePercent ?? null;
  if (body.consultationCardInstallments !== undefined) payload.consultation_card_installments = body.consultationCardInstallments || null;
  if (body.cardFeePercent !== undefined) payload.card_fee_percent = body.cardFeePercent;
  if (body.cardMaxInstallments !== undefined) payload.card_max_installments = body.cardMaxInstallments;

  const save = (row) =>
    existing?.id
      ? auth.ctx.supabase.from("payment_settings").update(row).eq("id", existing.id).select("*").single()
      : auth.ctx.supabase.from("payment_settings").insert(row).select("*").single();

  let result = await save(payload);
  let warning = null;
  // Sem a migração do cartão: salva o resto e avisa.
  if (result.error && !/pix_code/.test(String(result.error.message || "")) && isMissingPaymentColumn(result.error)) {
    const withoutCard = Object.fromEntries(Object.entries(payload).filter(([key]) => !CARD_COLUMNS.has(key)));
    result = await save(withoutCard);
    if (!result.error) warning = CARD_MIGRATION_MESSAGE;
  }

  if (result.error) {
    const text = String(result.error.message || "");
    const pixMissing = /pix_code/.test(text);
    const cardMissing = !pixMissing && isMissingPaymentColumn(result.error);
    return NextResponse.json(
      {
        message: pixMissing
          ? "Para salvar o PIX copia e cola é preciso rodar o SQL migrate-presencial-pacotes-pix.sql no Supabase."
          : cardMissing
            ? CARD_MIGRATION_MESSAGE
            : "Não foi possível salvar."
      },
      { status: pixMissing || cardMissing ? 503 : 500 }
    );
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "payment_settings_update",
    resourceType: "payment_settings",
    resourceId: result.data?.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ settings: result.data, warning });
}
