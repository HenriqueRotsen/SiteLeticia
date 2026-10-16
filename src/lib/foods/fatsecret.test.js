import { describe, expect, it } from "vitest";
import { mapFatSecretFood, parseFoodDescription } from "@/lib/foods/fatsecret";

describe("parseFoodDescription", () => {
  it("extracts per-100g nutrition from search snippets", () => {
    const parsed = parseFoodDescription(
      "Per 160g - Calories: 206kcal | Fat: 0.45g | Carbs: 44.50g | Protein: 4.24g"
    );

    expect(parsed?.defaultPortionG).toBe(160);
    expect(parsed?.per100g?.kcal).toBe(128.8);
    expect(parsed?.per100g?.protein_g).toBe(2.7);
  });
});

describe("mapFatSecretFood", () => {
  it("uses food_description when servings are missing", () => {
    const mapped = mapFatSecretFood({
      food_id: "4501",
      food_name: "White Rice",
      food_type: "Generic",
      food_description: "Per 160g - Calories: 206kcal | Fat: 0.45g | Carbs: 44.50g | Protein: 4.24g"
    });

    expect(mapped.per100g?.kcal).toBeGreaterThan(0);
    expect(mapped.defaultPortionG).toBe(160);
  });
});
