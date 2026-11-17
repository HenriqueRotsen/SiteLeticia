import { z } from "zod";

export const MIGRATION_MESSAGE =
  "Para usar pacotes é preciso rodar o SQL migrate-consultation-packages.sql no Supabase.";

export const packageInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(""),
  sessions: z.number().int().min(2).max(50),
  priceCents: z.number().int().min(0),
  active: z.boolean().optional().default(true)
});

export function packageRow(input) {
  return {
    name: input.name,
    description: input.description || null,
    sessions: input.sessions,
    price_cents: input.priceCents,
    active: input.active !== false,
    updated_at: new Date().toISOString()
  };
}

// Cópia do pacote para o paciente (o nome e o preço ficam como estavam na compra).
export function patientPackageRow(pkg, patientId, { paid = false } = {}) {
  const now = new Date().toISOString();
  return {
    patient_id: patientId,
    package_id: pkg.id,
    name: pkg.name,
    sessions_total: pkg.sessions,
    sessions_used: 0,
    price_cents: pkg.price_cents,
    payment_status: paid ? "paid" : "pending",
    paid_at: paid ? now : null
  };
}
