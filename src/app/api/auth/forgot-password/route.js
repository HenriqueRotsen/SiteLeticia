import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIp } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getSiteUrl } from "@/lib/site-url";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { passwordResetEmail, sendEmail } from "@/lib/email/resend";

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

  const generic = {
    ok: true,
    message:
      "Se existir uma conta com esse e-mail, enviamos um link para redefinir a senha. Verifique também a caixa de spam."
  };

  try {
    const admin = createSupabaseAdmin();
    const siteUrl = getSiteUrl(request);

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: body.email
    });

    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) {
      console.error("Forgot password generateLink failed:", error?.message || "missing token");
      return NextResponse.json(generic);
    }

    // Link próprio: evita o verify do Supabase perder o redirect para /redefinir-senha
    const resetUrl = `${siteUrl}/auth/confirm?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=${encodeURIComponent("/redefinir-senha")}`;

    const emailContent = passwordResetEmail({ resetUrl });
    await sendEmail({
      to: body.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
  } catch (error) {
    console.error("Forgot password Resend failed:", error.message);
  }

  return NextResponse.json(generic);
}
