// Lógica pura das tabelas do sistema: busca inteligente, filtros, ordenação e páginas.

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca por palavras em qualquer ordem, sem acento e sem maiúsculas.
 * Números também casam só pelos dígitos: "(61) 99177-4192" acha "61991774192".
 */
export function matchesQuery(fields, query) {
  const q = normalizeText(query);
  if (!q) return true;

  const values = (fields || []).filter((field) => field != null && field !== "").map(String);
  const text = values.map(normalizeText).join(" ");
  const digits = values.map((value) => value.replace(/\D/g, "")).join(" ");

  const queryDigits = q.replace(/\D/g, "");
  const looksLikeNumber = queryDigits.length >= 3 && /^[\d\s()+.\-/]+$/.test(q);
  if (looksLikeNumber) {
    const withoutCountry = queryDigits.length >= 12 && queryDigits.startsWith("55") ? queryDigits.slice(2) : queryDigits;
    return digits.includes(withoutCountry) || digits.includes(queryDigits) || text.includes(q);
  }

  return q.split(/\s+/).every((token) => {
    if (text.includes(token)) return true;
    const tokenDigits = token.replace(/\D/g, "");
    return tokenDigits.length >= 3 && tokenDigits === token && digits.includes(tokenDigits);
  });
}

export function applyFilters(rows, filters = [], values = {}) {
  const active = filters.filter((filter) => {
    const value = values[filter.key];
    return value != null && value !== (filter.defaultValue ?? "all");
  });
  if (!active.length) return rows;
  return rows.filter((row) => active.every((filter) => filter.predicate(row, values[filter.key])));
}

function compareValues(left, right) {
  const emptyLeft = left == null || left === "";
  const emptyRight = right == null || right === "";
  if (emptyLeft && emptyRight) return 0;
  // Vazios sempre no fim, em qualquer direção.
  if (emptyLeft) return Infinity;
  if (emptyRight) return -Infinity;
  if (typeof left === "number" && typeof right === "number") return left - right;
  return normalizeText(left).localeCompare(normalizeText(right), "pt-BR", { numeric: true });
}

export function sortRows(rows, column, direction = "asc") {
  if (!column?.sortValue) return rows;
  const dir = direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const result = compareValues(column.sortValue(a), column.sortValue(b));
    if (!Number.isFinite(result)) return result > 0 ? 1 : -1;
    return result * dir;
  });
}

export function paginate(rows, page, pageSize = DEFAULT_PAGE_SIZE) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total),
    rows: rows.slice(start, start + pageSize)
  };
}

/** Números de página com reticências: [1, "…", 4, 5, 6, "…", 12]. */
export function pageNumbers(page, totalPages, siblings = 1) {
  if (totalPages <= 5 + siblings * 2) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const start = Math.max(2, page - siblings);
  const end = Math.min(totalPages - 1, page + siblings);
  const items = [1];
  if (start > 2) items.push("…");
  for (let n = start; n <= end; n += 1) items.push(n);
  if (end < totalPages - 1) items.push("…");
  items.push(totalPages);
  return items;
}
