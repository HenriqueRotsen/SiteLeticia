import { SESSION_MAX_AGE_SECONDS, SESSION_TTL_MS, authCookieOptions } from "@/lib/auth/session-cookies";

export const MFA_OK_COOKIE = "lc_mfa_ok";
export const MFA_PENDING_COOKIE = "lc_mfa_pending";

function getOtpPepper() {
  return (
    process.env.OTP_HASH_SECRET ||
    process.env.TOKEN_ENCRYPTION_SECRET ||
    process.env.CPF_HASH_SECRET ||
    "dev-otp-secret"
  );
}

async function hmacHex(message) {
  const keyData = new TextEncoder().encode(getOtpPepper());
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signMfaOk(userId, ttlMs = SESSION_TTL_MS) {
  const exp = Date.now() + ttlMs;
  const payload = `${userId}.${exp}`;
  const sig = await hmacHex(payload);
  return `${payload}.${sig}`;
}

export async function verifyMfaOk(token, userId) {
  if (!token || !userId) return false;
  const [id, expRaw, sig] = String(token).split(".");
  if (!id || !expRaw || !sig) return false;
  if (id !== userId) return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const expected = await hmacHex(`${id}.${exp}`);
  if (expected.length !== sig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return mismatch === 0;
}

export function mfaCookieOptions(maxAgeSeconds = SESSION_MAX_AGE_SECONDS) {
  return {
    ...authCookieOptions,
    maxAge: maxAgeSeconds
  };
}
