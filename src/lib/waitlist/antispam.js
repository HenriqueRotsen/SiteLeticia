import { checkRateLimit } from "@/lib/rate-limit";

// reCAPTCHA v3 dá uma nota de 0 a 1. No iPhone, no app instalado ou em navegação privada a nota
// costuma vir baixa mesmo para pessoas reais, então a nota baixa não bloqueia sozinha:
// nesses casos o cadastro passa se não cair nas outras proteções (campo isca, tempo mínimo
// de preenchimento e limite de tentativas). Só bloqueia direto quando o Google tem quase certeza.
const PASS_SCORE = 0.5;
const BOT_SCORE = 0.1;
const MIN_FILL_MS = 2500;

export async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { status: "pass", reason: "not_configured" };
  if (!token) return { status: "unsure", reason: "missing_token" };

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token })
    });
    const result = await response.json();
    const details = {
      success: result.success,
      score: result.score,
      action: result.action,
      hostname: result.hostname,
      errors: result["error-codes"]
    };
    if (!result.success) return { status: "unsure", reason: "verify_failed", details };
    if (result.action && result.action !== "waitlist_signup") return { status: "unsure", reason: "wrong_action", details };
    if (typeof result.score === "number" && result.score < BOT_SCORE) return { status: "bot", reason: "very_low_score", details };
    if (typeof result.score === "number" && result.score < PASS_SCORE) return { status: "unsure", reason: "low_score", details };
    return { status: "pass", reason: "ok", details };
  } catch (error) {
    return { status: "unsure", reason: "verify_error", details: { error: error?.message } };
  }
}

export function antiSpamDecision({ recaptcha, honeypot, elapsedMs, ip }) {
  if (honeypot) return { ok: false, reason: "honeypot" };
  if (recaptcha.status === "bot") return { ok: false, reason: recaptcha.reason };
  if (recaptcha.status === "pass") return { ok: true };
  // Dúvida: confere tempo de preenchimento e limite de tentativas por conexão.
  if (typeof elapsedMs === "number" && elapsedMs < MIN_FILL_MS) return { ok: false, reason: "too_fast" };
  const limit = checkRateLimit(`waitlist-unsure:${ip}`, { limit: 5, windowMs: 10 * 60_000 });
  if (!limit.allowed) return { ok: false, reason: "rate_limited" };
  return { ok: true };
}
