import { describe, expect, it } from "vitest";
import { mapUsdaFood } from "@/lib/foods/usda";

describe("mapUsdaFood", () => {
  it("maps USDA nutrient ids to internal schema", () => {
    const mapped = mapUsdaFood({
      fdcId: 123,
      description: "Banana, raw",
      dataType: "Foundation",
      foodNutrients: [
        { nutrientId: 1008, value: 89 },
        { nutrientId: 1003, value: 1.1 },
        { nutrientId: 1005, value: 22.8 },
        { nutrientId: 1004, value: 0.3 },
        { nutrientId: 1079, value: 2.6 }
      ]
    });

    expect(mapped.source).toBe("usda");
    expect(mapped.externalId).toBe("123");
    expect(mapped.per100g.kcal).toBe(89);
    expect(mapped.per100g.protein_g).toBe(1.1);
    expect(mapped.per100g.fiber_g).toBe(2.6);
  });
});
