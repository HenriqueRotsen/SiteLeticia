import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { verifyLoginOtp } from "@/lib/auth/otp";
import {
  MFA_OK_COOKIE,
  MFA_PENDING_COOKIE,
  mfaCookieOptions,
  signMfaOk
} from "@/lib/auth/mfa-cookies";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session-cookies";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "Informe o código de 6 dígitos.")
});

function resolveHomePath(role) {
  return role === "nutritionist" ? "/admin" : "/app";
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`mfa-verify:${ip}`, { limit: 20, windowMs: 15 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  let body;
  try {
    body = schema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error.issues?.[0]?.message || "Código inválido." },
      { status: 400 }
    );
  }

  const pendingUserId = request.cookies.get(MFA_PENDING_COOKIE)?.value;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.id || !pendingUserId || user.id !== pendingUserId) {
    return NextResponse.json(
      { message: "Sessão de verificação expirada. Faça login novamente." },
      { status: 401 }
    );
  }

  const result = await verifyLoginOtp(user.id, body.code);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role === "nutritionist" ? "nutritionist" : "patient";

  const response = NextResponse.json({
    ok: true,
    role,
    redirectTo: resolveHomePath(role)
  });
  response.cookies.set(
    MFA_OK_COOKIE,
    await signMfaOk(user.id),
    mfaCookieOptions(SESSION_MAX_AGE_SECONDS)
  );
  response.cookies.set(MFA_PENDING_COOKIE, "", { ...mfaCookieOptions(0), maxAge: 0 });
  return response;
}
