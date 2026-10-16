import crypto from "crypto";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  MFA_OK_COOKIE,
  MFA_PENDING_COOKIE,
  mfaCookieOptions,
  signMfaOk,
  verifyMfaOk
} from "@/lib/auth/mfa-cookies";

export {
  MFA_OK_COOKIE,
  MFA_PENDING_COOKIE,
  mfaCookieOptions,
  signMfaOk,
  verifyMfaOk
};

const OTP_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

function getOtpPepper() {
  return (
    process.env.OTP_HASH_SECRET ||
    process.env.TOKEN_ENCRYPTION_SECRET ||
    process.env.CPF_HASH_SECRET ||
    "dev-otp-secret"
  );
}

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

export function hashOtpCode(code) {
  return crypto.createHmac("sha256", getOtpPepper()).update(String(code)).digest("hex");
}

export async function issueLoginOtp(userId) {
  const admin = createSupabaseAdmin();
  const code = generateOtpCode();
  const codeHash = hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  await admin.from("auth_email_otps").delete().eq("user_id", userId).eq("purpose", "login_mfa");

  const { error } = await admin.from("auth_email_otps").insert({
    user_id: userId,
    code_hash: codeHash,
    purpose: "login_mfa",
    expires_at: expiresAt
  });

  if (error) {
    throw new Error(error.message || "Não foi possível gerar o código.");
  }

  return { code, expiresAt };
}

export async function verifyLoginOtp(userId, code) {
  const admin = createSupabaseAdmin();
  const codeHash = hashOtpCode(code);

  const { data: rows, error } = await admin
    .from("auth_email_otps")
    .select("id, code_hash, expires_at, attempts, consumed_at")
    .eq("user_id", userId)
    .eq("purpose", "login_mfa")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message || "Falha ao validar código.");
  }

  const row = rows?.[0];
  if (!row || row.consumed_at) {
    return { ok: false, message: "Código inválido ou expirado." };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, message: "Código expirado. Solicite um novo." };
  }

  if (Number(row.attempts || 0) >= MAX_ATTEMPTS) {
    return { ok: false, message: "Muitas tentativas. Solicite um novo código." };
  }

  const matches = row.code_hash === codeHash;
  await admin
    .from("auth_email_otps")
    .update({
      attempts: Number(row.attempts || 0) + 1,
      consumed_at: matches ? new Date().toISOString() : null
    })
    .eq("id", row.id);

  if (!matches) {
    return { ok: false, message: "Código inválido." };
  }

  return { ok: true };
}
