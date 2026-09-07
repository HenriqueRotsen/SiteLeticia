import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  extractDietPlanFromFatSecretCsv,
  parseCsvLine,
  parseFatSecretNumber,
  parsePortionLabel
} from "./fatsecret-csv.js";

const SAMPLE_CSV = readFileSync(
  resolve(process.cwd(), "src/lib/diets/fixtures/fatsecret-detailed-report.csv"),
  "utf8"
);

describe("parseFatSecretNumber", () => {
  it("parses Brazilian decimal commas", () => {
    expect(parseFatSecretNumber("52,85")).toBe(52.85);
    expect(parseFatSecretNumber("1.675")).toBe(1.675);
    expect(parseFatSecretNumber("")).toBeNull();
  });
});

describe("parseCsvLine", () => {
  it("keeps quoted commas together", () => {
    expect(parseCsvLine('"   1 fatia, 50 g"')).toEqual(["   1 fatia, 50 g"]);
  });
});

describe("parsePortionLabel", () => {
  it("reads quantity and unit from the FatSecret portion", () => {
    expect(parsePortionLabel("1 fatia, 50 g")).toMatchObject({
      portionG: 50,
      measureUnit: "unidades",
      measureAmount: 1,
      gramsPerUnit: 50
    });
    expect(parsePortionLabel("200 ml")).toMatchObject({
      portionG: 200,
      measureUnit: "ml",
      measureAmount: 200
    });
    expect(parsePortionLabel("1 colher de sopa, 30 g")).toMatchObject({
      portionG: 30,
      measureUnit: "colher_sopa",
      measureAmount: 1,
      gramsPerUnit: 30
    });
    expect(parsePortionLabel("2 pequenos")).toMatchObject({
      measureUnit: "unidades",
      measureAmount: 2,
      gramsPerUnit: 50,
      estimated: true
    });
  });
});

describe("extractDietPlanFromFatSecretCsv", () => {
  it("parses the FatSecret detailed report sample", () => {
    const plan = extractDietPlanFromFatSecretCsv(SAMPLE_CSV, { title: "Plano teste" });

    expect(plan.source).toBe("fatsecret_csv");
    expect(plan.meals.map((meal) => meal.name)).toEqual([
      "Café da Manhã",
      "Almoço",
      "Jantar",
      "Lanches/Outros"
    ]);

    const breakfast = plan.meals[0];
    expect(breakfast.items).toHaveLength(5);
    expect(breakfast.items[0].label).toContain("Pullman");
    expect(breakfast.items[0].portionG).toBe(50);
    expect(breakfast.items[0].nutritionSnapshot.measureUnit).toBe("unidades");
    expect(breakfast.items[0].nutritionSnapshot.measureAmount).toBe(1);
    expect(breakfast.items[0].nutritionSnapshot.kcal).toBeGreaterThan(0);
    expect(Object.keys(breakfast.items[0].per100g)).toEqual(
      expect.arrayContaining([
        "kcal",
        "fat_g",
        "sat_fat_g",
        "carbs_g",
        "fiber_g",
        "sugar_g",
        "protein_g",
        "sodium_mg",
        "cholesterol_mg",
        "potassium_mg"
      ])
    );
    expect(breakfast.items[0].per100g.cholesterol_mg).toBeNull();
    expect(breakfast.items[0].per100g.potassium_mg).toBeNull();
    expect(breakfast.items[0].nutritionSnapshot.cholesterol_mg).toBeNull();

    const whey = breakfast.items.find((item) => item.label.includes("Whey"));
    expect(whey.portionG).toBe(28);
    expect(whey.nutritionSnapshot.measureUnit).toBe("unidades");

    const lunch = plan.meals[1];
    expect(lunch.items).toHaveLength(3);
    expect(lunch.items[0].portionG).toBe(100);

    const snack = plan.meals[3].items.find((item) => item.label.includes("Pão Francês"));
    expect(snack.portionG).toBe(100);
    expect(snack.nutritionSnapshot.portionEstimated).toBe(true);
  });
});
