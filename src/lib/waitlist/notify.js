// Avisos da fila de espera: a Letícia avisa as próximas pessoas, sempre na ordem da fila,
// com uma mensagem pronta no WhatsApp.

export const DEFAULT_BATCH_SIZE = 5;
export const MAX_BATCH_SIZE = 30;

export const DEFAULT_NOTIFY_TEMPLATE = [
  "Olá, {primeiro_nome}! Aqui é a Letícia Cunha, nutricionista.",
  "Chegou a sua vez na lista de espera: as consultas estão abertas e você já pode marcar a sua.",
  "É só criar sua conta (ou entrar) e escolher o melhor horário: {link}",
  "Qualquer dúvida, é só me responder por aqui."
].join("\n\n");

export const TEMPLATE_PLACEHOLDERS = ["{primeiro_nome}", "{nome}", "{posicao}", "{link}"];

function firstName(fullName) {
  const first = String(fullName || "").trim().split(/\s+/)[0] || "";
  return first ? first.charAt(0).toUpperCase() + first.slice(1).toLowerCase() : "";
}

export function renderNotifyMessage(template, { fullName, position, link }) {
  const text = String(template || DEFAULT_NOTIFY_TEMPLATE);
  return text
    .replaceAll("{primeiro_nome}", firstName(fullName))
    .replaceAll("{nome}", String(fullName || "").trim())
    .replaceAll("{posicao}", position ? `${position}º` : "")
    .replaceAll("{link}", link || "");
}

export function waitlistWhatsappLink(phone, message) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const number = digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function clampBatchSize(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < 1) return DEFAULT_BATCH_SIZE;
  return Math.min(n, MAX_BATCH_SIZE);
}

/** As próximas `size` pessoas aguardando, na ordem da fila (por ordem de cadastro). */
export function nextInLine(entries, size) {
  return (entries || [])
    .filter((entry) => entry.status === "waiting")
    .sort((a, b) => a.id - b.id)
    .slice(0, clampBatchSize(size));
}

/**
 * Só deixa avisar quem está entre as próximas `windowSize` pessoas da fila,
 * para ninguém ser avisado antes de quem entrou primeiro.
 */
export function outOfOrderIds(entries, ids, windowSize) {
  const allowed = new Set(nextInLine(entries, Math.max(clampBatchSize(windowSize), ids.length)).map((e) => e.id));
  return ids.filter((id) => !allowed.has(id));
}
