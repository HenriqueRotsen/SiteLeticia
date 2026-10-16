import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { issueLoginOtp } from "@/lib/auth/otp";
import { MFA_OK_COOKIE, MFA_PENDING_COOKIE, mfaCookieOptions } from "@/lib/auth/mfa-cookies";
import { loginOtpEmail, sendEmail } from "@/lib/email/resend";

function resolveHomePath(role) {
  return role === "nutritionist" ? "/admin" : "/app";
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  let body;
  try {
    body = loginSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password
  });

  if (error) {
    return NextResponse.json({ message: "E-mail ou senha inválidos." }, { status: 401 });
  }

  const user = data.user;
  const userId = user?.id;
  let role = "patient";

  if (userId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.role === "nutritionist") {
      role = "nutritionist";
    }
  }

  const requireMfa = process.env.AUTH_EMAIL_MFA !== "false";

  if (!requireMfa || !userId) {
    const response = NextResponse.json({
      ok: true,
      role,
      redirectTo: resolveHomePath(role)
    });
    response.cookies.set(MFA_OK_COOKIE, "", { ...mfaCookieOptions(0), maxAge: 0 });
    response.cookies.set(MFA_PENDING_COOKIE, "", { ...mfaCookieOptions(0), maxAge: 0 });
    return response;
  }

  try {
    const { code } = await issueLoginOtp(userId);
    const emailContent = loginOtpEmail({ code });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
  } catch (sendError) {
    console.error("Login MFA email failed:", sendError.message);
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        message:
          "Não foi possível enviar o código de verificação por e-mail. Verifique a configuração do Resend."
      },
      { status: 503 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    requiresMfa: true,
    role,
    redirectTo: "/verificar-codigo",
    message: "Enviamos um código de 6 dígitos para o seu e-mail."
  });

  response.cookies.set(MFA_PENDING_COOKIE, userId, mfaCookieOptions(10 * 60));
  response.cookies.set(MFA_OK_COOKIE, "", { ...mfaCookieOptions(0), maxAge: 0 });
  return response;
}
