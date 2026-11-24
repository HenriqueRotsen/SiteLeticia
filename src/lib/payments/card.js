// PIX ou cartão de crédito (por link de pagamento), com a taxa do cartão repassada.

export const PAYMENT_METHODS = ["pix", "card"];

export const CARD_MIGRATION_MESSAGE =
  "Para usar o pagamento no cartão é preciso rodar o SQL migrate-pagamento-cartao.sql no Supabase.";

export function paymentMethodLabel(method) {
  return method === "card" ? "Cartão de crédito" : "PIX";
}

/**
 * Preço no cartão que deixa o mesmo valor líquido do PIX depois da taxa
 * (valor ÷ (1 − taxa)), arredondado para cima no real inteiro.
 */
export function suggestCardPriceCents(pixCents, feePercent) {
  const pix = Math.max(0, Math.round(Number(pixCents) || 0));
  const fee = Number(feePercent) || 0;
  if (!pix || fee <= 0) return pix;
  if (fee >= 100) return pix;
  const gross = pix / (1 - fee / 100);
  return Math.ceil(gross / 100) * 100;
}

export function cardExtraCents(pixCents, cardCents) {
  return Math.max(0, (Number(cardCents) || 0) - (Number(pixCents) || 0));
}

export function clampInstallments(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 12);
}

/** Valor de cada parcela (centavos, arredondado para cima). */
export function installmentCents(totalCents, installments) {
  const n = clampInstallments(installments);
  return Math.ceil((Number(totalCents) || 0) / n);
}

export function normalizePaymentLink(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function isValidPaymentLink(raw) {
  return !String(raw || "").trim() || Boolean(normalizePaymentLink(raw));
}

/**
 * Opções de pagamento de um produto. O cartão só aparece com link cadastrado;
 * sem preço próprio, usa o sugerido pela taxa.
 */
export function paymentOptions({ pixCents, pixCode = null, cardCents = null, cardLink = null, feePercent = 0, maxInstallments = 1 }) {
  const options = [{ method: "pix", cents: Number(pixCents) || 0, pixCode: pixCode || null }];
  const link = normalizePaymentLink(cardLink);
  if (link) {
    const cents = Number(cardCents) > 0 ? Number(cardCents) : suggestCardPriceCents(pixCents, feePercent);
    const installments = clampInstallments(maxInstallments);
    options.push({
      method: "card",
      cents,
      link,
      installments,
      installmentCents: installmentCents(cents, installments)
    });
  }
  return options;
}

export function consultationPaymentOptions(settings = {}) {
  return paymentOptions({
    pixCents: settings.consultation_price_cents,
    pixCode: settings.consultation_pix_code,
    cardCents: settings.consultation_card_price_cents,
    cardLink: settings.consultation_card_link,
    feePercent: settings.card_fee_percent,
    maxInstallments: settings.card_max_installments
  });
}

export function packagePaymentOptions(pkg = {}, settings = {}) {
  return paymentOptions({
    pixCents: pkg.price_cents,
    pixCode: pkg.pix_code,
    cardCents: pkg.card_price_cents,
    cardLink: pkg.card_link,
    feePercent: settings.card_fee_percent,
    maxInstallments: settings.card_max_installments
  });
}

export function pickOption(options, method) {
  return options.find((option) => option.method === method) || options[0];
}

export function isMissingPaymentColumn(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`;
  return /42703|PGRST204/.test(text) || /card_|payment_method/.test(text);
}
