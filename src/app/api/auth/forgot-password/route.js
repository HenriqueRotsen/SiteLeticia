import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { buildAuthCallbackUrl } from "@/lib/site-url";
import { forgotPasswordSchema } from "@/lib/validation/schemas";

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`forgot-password:${ip}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  let body;
  try {
    body = forgotPasswordSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "E-mail inválido." }, { status: 400 });
  }

  const supabase = await createClient();
  const redirectTo = buildAuthCallbackUrl(request, "/redefinir-senha");

  const { error } = await supabase.auth.resetPasswordForEmail(body.email, { redirectTo });

  if (error) {
    console.error("Forgot password failed:", error.message);
  }

  return NextResponse.json({
    ok: true,
    message:
      "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Verifique também a caixa de spam."
  });
}
