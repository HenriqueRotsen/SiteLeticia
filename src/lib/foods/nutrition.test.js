import { describe, expect, it } from "vitest";
import {
  formatNutritionTotals,
  formatScaledNutrition,
  sanitizePer100g,
  scaleNutrition,
  sumNutrition,
  totalPortionGrams
} from "@/lib/foods/nutrition";

describe("nutrition helpers", () => {
  const per100g = {
    kcal: 128,
    protein_g: 2.5,
    carbs_g: 28.1,
    fat_g: 0.2,
    fiber_g: 1.6,
    calcium_mg: 10,
    iron_mg: 0.5
  };

  it("calculates total grams from quantity and portion", () => {
    expect(totalPortionGrams(2, 100)).toBe(200);
    expect(totalPortionGrams(1.5, 80)).toBe(120);
  });

  it("scales nutrition proportionally", () => {
    expect(scaleNutrition(per100g, 200)).toEqual({
      kcal: 256,
      protein_g: 5,
      carbs_g: 56.2,
      fat_g: 0.4,
      fiber_g: 3.2,
      calcium_mg: 20,
      iron_mg: 1
    });
  });

  it("formats scaled nutrition for display", () => {
    expect(formatScaledNutrition(per100g, 1, 150)).toBe(
      "192 kcal (150g) · P 3.8g · C 42.2g · G 0.3g · F 2.4g"
    );
  });

  it("sanitizes long decimal averages from food tables", () => {
    expect(
      sanitizePer100g({
        kcal: 123.53489250000001,
        protein_g: 2.58825,
        carbs_g: 25.80975,
        fat_g: 1.0003333333333333,
        fiber_g: 2.749333333333334,
        sodium_mg: 1.2446666666666666
      })
    ).toEqual({
      kcal: 124,
      protein_g: 2.6,
      carbs_g: 25.8,
      fat_g: 1,
      fiber_g: 2.7,
      sodium_mg: 1
    });
  });

  it("sums meal totals including fiber and micronutrients", () => {
    const totals = sumNutrition([
      { per100g, quantity: 1, portionG: 100 },
      { per100g, quantity: 2, portionG: 50 }
    ]);

    expect(totals.kcal).toBe(256);
    expect(totals.fiber_g).toBe(3.2);
    expect(totals.calcium_mg).toBe(20);
    expect(formatNutritionTotals(totals)).toBe("256 kcal · P 5g · C 56.2g · G 0.4g · F 3.2g");
  });
});
