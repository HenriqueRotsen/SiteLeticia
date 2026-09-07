import { NextResponse } from "next/server";
import { getUsdaFood, isUsdaConfigured } from "@/lib/foods/usda";
import { requireAuth } from "@/lib/auth";

export async function GET(_request, { params }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  if (!isUsdaConfigured()) {
    return NextResponse.json({ message: "USDA API não configurada." }, { status: 503 });
  }

  try {
    const food = await getUsdaFood(params.id);
    if (!food) {
      return NextResponse.json({ message: "Alimento não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ food });
  } catch (error) {
    console.error("USDA food detail failed:", error);
    return NextResponse.json({ message: "Erro ao buscar alimento USDA." }, { status: 502 });
  }
}
