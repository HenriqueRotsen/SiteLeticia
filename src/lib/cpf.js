import crypto from "crypto";

export function normalizeCpf(value) {
  return String(value || "").replace(/\D/g, "");
}

export function isValidCpf(cpf) {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === Number(digits[10]);
}

export function hashCpf(cpf) {
  const secret = process.env.CPF_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-cpf-secret";
  return crypto.createHmac("sha256", secret).update(normalizeCpf(cpf)).digest("hex");
}

export function maskCpf(cpf) {
  if (!cpf) return "Pendente";
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return "Pendente";
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

export function formatCpf(cpf) {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
