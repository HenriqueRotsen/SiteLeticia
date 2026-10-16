export function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

export function formatPhone(value) {
  const digits = normalizePhone(value);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value) {
  const digits = normalizePhone(value);
  return digits.length >= 10 && digits.length <= 11;
}
