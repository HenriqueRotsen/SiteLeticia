import { describe, expect, it } from "vitest";
import {
  formatMeasureLabel,
  restoreMeasureFromStored,
  toStoredPortion
} from "@/lib/foods/measures";

describe("food measures", () => {
  it("converts spoon amounts to stored grams", () => {
    expect(toStoredPortion("colher_sopa", 2)).toEqual({
      quantity: 2,
      portionG: 15,
      measureUnit: "colher_sopa",
      measureAmount: 2,
      gramsPerUnit: 15
    });
  });

  it("stores grams directly", () => {
    expect(toStoredPortion("gramas", 150)).toEqual({
      quantity: 1,
      portionG: 150,
      measureUnit: "gramas",
      measureAmount: 150
    });
  });

  it("supports portions in units", () => {
    expect(toStoredPortion("unidades", 2)).toEqual({
      quantity: 2,
      portionG: 100,
      measureUnit: "unidades",
      measureAmount: 2,
      gramsPerUnit: 100
    });
    expect(formatMeasureLabel("unidades", 2)).toBe("2 unidades (200g)");

    expect(toStoredPortion("unidades", 2, 50)).toEqual({
      quantity: 2,
      portionG: 50,
      measureUnit: "unidades",
      measureAmount: 2,
      gramsPerUnit: 50
    });
  });

  it("formats measure labels in portuguese", () => {
    expect(formatMeasureLabel("colher_sobremesa", 2)).toBe("2 colheres de sobremesa (15g)");
    expect(formatMeasureLabel("gramas", 120)).toBe("120g");
    expect(formatMeasureLabel("ml", 200)).toBe("200 ml");
    expect(formatMeasureLabel("litros", 0.5)).toBe("0.5 L (500 ml)");
  });

  it("stores milliliters and liters for nutrition math", () => {
    expect(toStoredPortion("ml", 250)).toEqual({
      quantity: 1,
      portionG: 250,
      measureUnit: "ml",
      measureAmount: 250
    });
    expect(toStoredPortion("litros", 1)).toEqual({
      quantity: 1,
      portionG: 1000,
      measureUnit: "litros",
      measureAmount: 1
    });
  });

  it("restores measure metadata from snapshot", () => {
    const restored = restoreMeasureFromStored(1, 100, {
      kcal: 128,
      protein_g: 2.5,
      measureUnit: "colher_cha",
      measureAmount: 3
    });

    expect(restored.measureUnit).toBe("colher_cha");
    expect(restored.measureAmount).toBe(3);
    expect(restored.portionG).toBe(5);
    expect(restored.quantity).toBe(3);
  });
});
