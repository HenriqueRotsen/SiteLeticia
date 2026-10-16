import { NextResponse } from "next/server";
import { getSearchCapabilities } from "@/lib/foods/search";
import { FOOD_SOURCES } from "@/lib/foods/sources";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const allSources = [
    FOOD_SOURCES.TBCA,
    FOOD_SOURCES.TACO,
    FOOD_SOURCES.USDA,
    FOOD_SOURCES.FATSECRET
  ];

  return NextResponse.json({
    capabilities: getSearchCapabilities(allSources)
  });
}
