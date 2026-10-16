import { describe, expect, it, vi, beforeEach } from "vitest";
import { FOOD_SOURCES } from "@/lib/foods/sources";

const searchFatSecret = vi.fn();
const searchTaco = vi.fn();

vi.mock("@/lib/foods/fatsecret", () => ({
  isFatSecretConfigured: () => true,
  searchFatSecret: (...args) => searchFatSecret(...args)
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        ilike: () => ({
          limit: () =>
            Promise.resolve({
              data: [{ id: 1, name: "Feijão, preto, cozido", per_100g: { kcal: 77 } }]
            })
        })
      })
    })
  })
}));

vi.mock("@/lib/foods/usda", () => ({
  isUsdaConfigured: () => false,
  searchUsda: vi.fn()
}));

import { searchFoods, buildFlexibleSearchPattern } from "@/lib/foods/search";

describe("buildFlexibleSearchPattern", () => {
  it("matches TACO names when query uses spaces instead of commas", () => {
    expect(buildFlexibleSearchPattern("Feijão preto")).toBe("%Feijão%preto%");
    expect(buildFlexibleSearchPattern("arroz integral cozido")).toBe("%arroz%integral%cozido%");
  });

  it("keeps single-word searches unchanged", () => {
    expect(buildFlexibleSearchPattern("banana")).toBe("%banana%");
  });
});

describe("searchFoods mixed provider", () => {
  beforeEach(() => {
    searchFatSecret.mockReset();
    searchFatSecret.mockResolvedValue([
      { source: "fatsecret", externalId: "1", label: "Prego Sauce" }
    ]);
  });

  it("does not query FatSecret when it is not in sources", async () => {
    const results = await searchFoods("feijão", {
      provider: "mixed",
      sources: [FOOD_SOURCES.TACO]
    });

    expect(searchFatSecret).not.toHaveBeenCalled();
    expect(results.every((item) => item.source !== FOOD_SOURCES.FATSECRET)).toBe(true);
  });

  it("queries FatSecret only when explicitly enabled", async () => {
    await searchFoods("feijão", {
      provider: "mixed",
      sources: [FOOD_SOURCES.TACO, FOOD_SOURCES.FATSECRET]
    });

    expect(searchFatSecret).toHaveBeenCalledOnce();
  });
});
