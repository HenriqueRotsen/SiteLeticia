import { describe, expect, it } from "vitest";
import { centsToReais, formatReais, parseReaisInput, reaisToCents } from "@/lib/money";

describe("money", () => {
  it("converts cents and reais", () => {
    expect(centsToReais(25000)).toBe(250);
    expect(reaisToCents(250)).toBe(25000);
    expect(reaisToCents(0)).toBe(0);
  });

  it("formats and parses reais input", () => {
    expect(formatReais(250)).toMatch(/250/);
    expect(parseReaisInput("R$ 1.250")).toBe(1250);
    expect(parseReaisInput("")).toBe(0);
  });
});
