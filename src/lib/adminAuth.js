import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "leticia_admin_session";

const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function getSessionSecret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-only-admin-session-secret"
  );
}

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createAdminSession(username) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = encode(JSON.stringify({ username, expiresAt }));
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token) {
  if (!token || !token.includes(".")) return false;

  const [payload, signature] = token.split(".");
  const expectedSignature = sign(payload);
  const signatureBuffer = Buffer.from(signature || "");
  const expectedSignatureBuffer = Buffer.from(expectedSignature || "");

  if (signatureBuffer.length !== expectedSignatureBuffer.length) return false;

  if (!crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
    return false;
  }

  try {
    const session = JSON.parse(decode(payload));
    return Boolean(session?.expiresAt && session.expiresAt > Math.floor(Date.now() / 1000));
  } catch {
    return false;
  }
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS
  };
}
