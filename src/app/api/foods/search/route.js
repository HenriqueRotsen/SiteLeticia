import { NextResponse } from "next/server";
import { searchFoods, getSearchCapabilities } from "@/lib/foods/search";
import { parseFoodSourcesParam } from "@/lib/foods/sources";
import { requireAuth } from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/audit";

export async function GET(request) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const ip = getClientIp(request);
  const rate = checkRateLimit(`food-search:${ip}`, { limit: 60, windowMs: 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const provider = url.searchParams.get("provider") || "mixed";
  const sources = parseFoodSourcesParam(url.searchParams.get("sources"));

  try {
    const results = await searchFoods(q, { provider, sources });
    const capabilities = getSearchCapabilities(sources);

    return NextResponse.json({
      results,
      provider,
      sources,
      capabilities
    });
  } catch (error) {
    console.error("Food search failed:", error);
    const message =
      error.message?.includes("Invalid IP address")
        ? "IP do servidor não liberado no painel FatSecret. Adicione seu IP em Manage API Keys."
        : error.message?.includes("USDA API")
          ? "Erro na API USDA. Verifique USDA_API_KEY."
          : "Não foi possível buscar alimentos agora. Tente novamente.";

    return NextResponse.json(
      {
        results: [],
        provider,
        sources,
        capabilities: getSearchCapabilities(sources),
        message
      },
      { status: 502 }
    );
  }
}
