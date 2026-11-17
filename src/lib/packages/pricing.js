// Contas dos pacotes de consultas (usado no navegador e no servidor).

export function perSessionCents(pkg) {
  const sessions = Number(pkg?.sessions || pkg?.sessions_total) || 0;
  if (!sessions) return 0;
  return Math.round((Number(pkg.price_cents) || 0) / sessions);
}

// Quanto o paciente economiza em relação a pagar as consultas avulsas.
export function packageSavings(pkg, regularPriceCents) {
  const sessions = Number(pkg?.sessions) || 0;
  const regular = (Number(regularPriceCents) || 0) * sessions;
  const price = Number(pkg?.price_cents) || 0;
  if (!regular || price >= regular) return { savingsCents: 0, discountPercent: 0, regularTotalCents: regular };
  return {
    savingsCents: regular - price,
    discountPercent: Math.round(((regular - price) / regular) * 100),
    regularTotalCents: regular
  };
}

// Preço do pacote a partir de um desconto (%), arredondado para reais inteiros.
export function priceFromDiscount(sessions, regularPriceCents, discountPercent) {
  const total = (Number(sessions) || 0) * (Number(regularPriceCents) || 0);
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  return Math.round((total * (1 - pct / 100)) / 100) * 100;
}

export function remainingSessions(patientPackage) {
  if (!patientPackage) return 0;
  return Math.max(0, (Number(patientPackage.sessions_total) || 0) - (Number(patientPackage.sessions_used) || 0));
}

// Pacote pago mais antigo que ainda tem consultas sobrando: é o que a próxima consulta usa.
export function pickUsablePackage(patientPackages = []) {
  return (
    patientPackages
      .filter((item) => item.payment_status === "paid" && remainingSessions(item) > 0)
      .sort((a, b) => new Date(a.paid_at || a.created_at) - new Date(b.paid_at || b.created_at))[0] || null
  );
}

export function packageStatusLabel(patientPackage) {
  if (patientPackage.payment_status === "cancelled") return { label: "Cancelado", variant: "neutral" };
  if (patientPackage.payment_status === "pending") return { label: "Aguardando pagamento", variant: "warning" };
  if (remainingSessions(patientPackage) === 0) return { label: "Concluído", variant: "neutral" };
  return { label: "Ativo", variant: "success" };
}
