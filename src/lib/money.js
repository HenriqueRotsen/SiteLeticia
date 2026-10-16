/** Converte centavos (armazenamento) para reais inteiros (UI). */
export function centsToReais(cents) {
  return Math.round((Number(cents) || 0) / 100);
}

/** Converte reais inteiros (UI) para centavos (API/DB). */
export function reaisToCents(reais) {
  return Math.max(0, Math.round(Number(reais) || 0) * 100);
}

/** Formata reais inteiros como R$ 1.250 */
export function formatReais(reais) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(reais) || 0);
}

/** Extrai apenas dígitos e interpreta como reais inteiros. */
export function parseReaisInput(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits);
}
