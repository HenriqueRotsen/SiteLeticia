import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

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

  const userId = data.user?.id;
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

  return NextResponse.json({
    ok: true,
    role,
    redirectTo: resolveHomePath(role)
  });
}
