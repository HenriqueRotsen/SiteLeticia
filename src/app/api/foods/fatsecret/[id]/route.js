import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getFatSecretFood, isFatSecretConfigured } from "@/lib/foods/fatsecret";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

export async function GET(request, { params }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  if (!isFatSecretConfigured()) {
    return NextResponse.json({ message: "FatSecret não configurado." }, { status: 503 });
  }

  const ip = getClientIp(request);
  const rate = checkRateLimit(`food-detail:${ip}`, { limit: 120, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  try {
    const food = await getFatSecretFood(params.id);
    if (!food) {
      return NextResponse.json({ message: "Alimento não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ food });
  } catch (error) {
    console.error("FatSecret food detail failed:", error);
    return NextResponse.json({ message: "Erro ao buscar alimento." }, { status: 502 });
  }
}
