import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getClientIp } from "@/lib/audit";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { resetPasswordSchema } from "@/lib/validation/schemas";

export async function POST(request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const rate = checkRateLimit(`reset-password:${ip}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  const parsed = resetPasswordSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        message:
          parsed.error.issues[0]?.message || "Informe uma senha válida com pelo menos 8 caracteres."
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: body.password });

  if (error) {
    console.error("Reset password failed:", error.message);
    return NextResponse.json({ message: "Não foi possível redefinir a senha." }, { status: 500 });
  }

  await supabase.auth.signOut();

  return NextResponse.json({
    ok: true,
    message: "Senha redefinida com sucesso. Faça login com a nova senha."
  });
}
