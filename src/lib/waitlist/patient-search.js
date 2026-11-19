// Busca de pacientes (nome ou telefone) e posição de cada um na fila de espera.

import { normalizeWaitlistPhone } from "@/lib/waitlist/position";

// Caracteres que quebram a sintaxe do filtro .or() do PostgREST.
const UNSAFE_FILTER_CHARS = /[,()*%\\"]/g;

/**
 * Monta o filtro .or() a partir do que a nutricionista digitou.
 * "(61) 99177-4192", "61991774192" e "+55 61 99177-4192" encontram o mesmo telefone,
 * que fica salvo só com dígitos.
 */
export function patientSearchFilter(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;

  const conditions = [];
  const name = text.replace(UNSAFE_FILTER_CHARS, " ").replace(/\s+/g, " ").trim();
  if (name) conditions.push(`full_name.ilike.*${name}*`);

  const digits = text.replace(/\D/g, "");
  if (digits.length >= 3) {
    const phone = normalizeWaitlistPhone(digits);
    conditions.push(`phone.ilike.*${phone}*`);
  }

  return conditions.length ? conditions.join(",") : null;
}

/**
 * Mapa waitlistId -> { status, position }. A posição segue a mesma regra da
 * consulta pública: ordem de cadastro, contando só quem ainda aguarda.
 */
export function waitlistPositions(entries = []) {
  const map = new Map();
  let position = 0;
  for (const entry of [...entries].sort((a, b) => a.id - b.id)) {
    if (entry.status === "waiting") {
      position += 1;
      map.set(entry.id, { status: "waiting", position, createdAt: entry.created_at || null });
    } else {
      map.set(entry.id, { status: entry.status, position: null, createdAt: entry.created_at || null });
    }
  }
  return map;
}
