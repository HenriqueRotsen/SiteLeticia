import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getClientIp } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { buildAuthCallbackUrl } from "@/lib/site-url";
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
    const redirectTo = buildAuthCallbackUrl(request, "/redefinir-senha");

    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: body.email,
      options: { redirectTo }
    });

    if (error || !data?.properties?.action_link) {
      console.error("Forgot password generateLink failed:", error?.message || "missing link");
      return NextResponse.json(generic);
    }

    const resetUrl = data.properties.action_link;
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
