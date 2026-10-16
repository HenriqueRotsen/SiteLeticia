import { describe, expect, it } from "vitest";
import {
  isTbcaComplementFood,
  isTbcaIngredient,
  normalizeFoodLabel,
  normalizeTbcaDisplayName
} from "./tbca-filter";

describe("normalizeTbcaDisplayName", () => {
  it("shortens TBCA names to TACO-like labels", () => {
    expect(
      normalizeTbcaDisplayName(
        "Feijão, carioca, cozido, s/ óleo, s/ sal, Phaseolus vulgaris L."
      )
    ).toBe("Feijão, carioca, cozido");
  });
});

describe("isTbcaIngredient", () => {
  it("rejects composite dishes with ingredient lists", () => {
    expect(
      isTbcaIngredient({
        descricao: "Papa de carne, arroz branco e brócolis, c/ caldo, c/ sal"
      })
    ).toBe(false);
  });

  it("rejects soups and prepared meals", () => {
    expect(isTbcaIngredient({ descricao: "Sopa, creme de ervilha, c/ bacon" })).toBe(false);
  });

  it("accepts basic ingredients", () => {
    expect(
      isTbcaIngredient({
        descricao: "Feijão, carioca, cozido, s/ óleo, s/ sal, Phaseolus vulgaris L.",
        classe: "Leguminosas e derivados"
      })
    ).toBe(true);
  });
});

describe("isTbcaComplementFood", () => {
  it("skips foods already covered by TACO", () => {
    const tacoLabels = new Set([normalizeFoodLabel("Feijão, carioca, cozido")]);

    expect(
      isTbcaComplementFood(
        {
          descricao: "Feijão, carioca, cozido, s/ óleo, s/ sal, Phaseolus vulgaris L.",
          classe: "Leguminosas e derivados"
        },
        tacoLabels
      )
    ).toBe(false);
  });

  it("accepts unique basic foods", () => {
    expect(
      isTbcaComplementFood(
        {
          descricao: "Banana, prata, in natura, Musa sp.",
          classe: "Frutas e derivados"
        },
        new Set()
      )
    ).toBe(true);
  });
});
