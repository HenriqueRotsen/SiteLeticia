import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";
import { getWaitlistStatus, normalizeWaitlistPhone } from "@/lib/waitlist/position";

export async function GET(request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`waitlist-position:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  const phone = normalizeWaitlistPhone(new URL(request.url).searchParams.get("phone") || "");

  if (phone.length < 10) {
    return NextResponse.json({ message: "Informe um WhatsApp válido com DDD." }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const status = await getWaitlistStatus(supabase, { phone });

    if (!status.found) {
      return NextResponse.json({ message: "Não encontramos cadastro com esse WhatsApp." }, { status: 404 });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error("Waitlist position lookup failed:", error);
    return NextResponse.json(
      { message: "Não foi possível consultar sua posição agora." },
      { status: 500 }
    );
  }
}
