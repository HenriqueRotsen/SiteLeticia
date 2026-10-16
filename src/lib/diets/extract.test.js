import { describe, expect, it } from "vitest";
import {
  buildDietExtractionSummary,
  extractDietPlanFromTextHeuristic,
  normalizeExtractedDietPlan,
  portionNutritionToPer100g
} from "./extract.js";

describe("portionNutritionToPer100g", () => {
  it("scales portion nutrients to per 100g", () => {
    const per100g = portionNutritionToPer100g(
      { kcal: 158, protein_g: 5.6, carbs_g: 27, fat_g: 3.2 },
      40
    );

    expect(per100g.kcal).toBe(395);
    expect(per100g.protein_g).toBe(14);
  });
});

describe("extractDietPlanFromTextHeuristic", () => {
  it("parses meal headers and kcal lines", () => {
    const text = `
Café da manhã
Aveia em flocos 40g 158 kcal P:5.6g C:27g G:3.2g
Banana 80g 71 kcal

Almoço
Frango grelhado 120g 198 kcal P:37g C:0g G:4g
Arroz branco 100g 130 kcal
`;

    const plan = extractDietPlanFromTextHeuristic(text, { title: "Plano teste" });

    expect(plan.title).toBe("Plano teste");
    expect(plan.meals).toHaveLength(2);
    expect(plan.meals[0].name.toLowerCase()).toContain("café");
    expect(plan.meals[0].items).toHaveLength(2);
    expect(plan.meals[0].items[0].portionG).toBe(40);
    expect(plan.meals[0].items[0].nutritionSnapshot.kcal).toBeGreaterThan(0);
    expect(plan.meals[1].items[0].label.toLowerCase()).toContain("frango");
  });
});

describe("normalizeExtractedDietPlan", () => {
  it("drops empty meals and builds snapshots", () => {
    const plan = normalizeExtractedDietPlan({
      title: "FatSecret",
      meals: [
        {
          name: "Jantar",
          items: [{ label: "Salmão", portionG: 150, kcal: 280, protein_g: 30, fat_g: 18, carbs_g: 0 }]
        },
        { name: "Vazio", items: [] }
      ]
    });

    expect(plan.meals).toHaveLength(1);
    expect(plan.meals[0].items[0].source).toBe("fatsecret_pdf");
    expect(plan.meals[0].items[0].nutritionSnapshot.measureUnit).toBe("gramas");
    expect(buildDietExtractionSummary(plan)).toContain("1 refeição");
  });
});
