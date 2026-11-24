import { z } from "zod";
import { normalizePaymentLink, packagePaymentOptions, pickOption } from "@/lib/payments/card";

export const MIGRATION_MESSAGE =
  "Para usar pacotes é preciso rodar o SQL migrate-presencial-pacotes-pix.sql no Supabase.";

export const packageInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(""),
  sessions: z.number().int().min(2).max(50),
  priceCents: z.number().int().min(0),
  active: z.boolean().optional().default(true),
  pixCode: z.string().max(600).nullable().optional(),
  cardPriceCents: z.number().int().min(0).nullable().optional(),
  cardLink: z.string().max(600).nullable().optional()
});

export function packageRow(input) {
  return {
    name: input.name,
    description: input.description || null,
    sessions: input.sessions,
    price_cents: input.priceCents,
    active: input.active !== false,
    ...(input.pixCode !== undefined ? { pix_code: String(input.pixCode || "").replace(/[\r\n]+/g, "").trim() || null } : {}),
    ...(input.cardPriceCents !== undefined ? { card_price_cents: input.cardPriceCents || null } : {}),
    ...(input.cardLink !== undefined ? { card_link: normalizePaymentLink(input.cardLink) } : {}),
    updated_at: new Date().toISOString()
  };
}

// Antes da migração do cartão: grava o pacote sem os campos de cartão.
export function withoutCardFields(row) {
  return Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith("card_") && key !== "payment_method"));
}

// Cópia do pacote para o paciente (o nome e o preço ficam como estavam na compra).
// No cartão, o preço guardado é o do cartão e o link vai junto.
export function patientPackageRow(pkg, patientId, { paid = false, paymentMethod = "pix", settings = {} } = {}) {
  const now = new Date().toISOString();
  const option = pickOption(packagePaymentOptions(pkg, settings), paymentMethod);
  const card = option.method === "card";
  return {
    patient_id: patientId,
    package_id: pkg.id,
    name: pkg.name,
    sessions_total: pkg.sessions,
    sessions_used: 0,
    price_cents: option.cents,
    pix_code: card ? null : pkg.pix_code || null,
    ...(card ? { payment_method: "card", card_link: option.link } : {}),
    payment_status: paid ? "paid" : "pending",
    paid_at: paid ? now : null
  };
}
