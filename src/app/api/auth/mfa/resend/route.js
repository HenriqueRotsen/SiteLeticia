import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { issueLoginOtp } from "@/lib/auth/otp";
import { MFA_PENDING_COOKIE, mfaCookieOptions } from "@/lib/auth/mfa-cookies";
import { loginOtpEmail, sendEmail } from "@/lib/email/resend";

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`mfa-resend:${ip}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

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

  try {
    const { code } = await issueLoginOtp(user.id);
    const emailContent = loginOtpEmail({ code });
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
  } catch (error) {
    console.error("MFA resend failed:", error.message);
    return NextResponse.json(
      { message: "Não foi possível reenviar o código. Tente novamente." },
      { status: 503 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    message: "Enviamos um novo código para o seu e-mail."
  });
  response.cookies.set(MFA_PENDING_COOKIE, user.id, mfaCookieOptions(10 * 60));
  return response;
}
