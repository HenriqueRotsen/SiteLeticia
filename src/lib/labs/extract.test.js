import { extractMarkersFromText } from "@/lib/labs/extract";
import { describe, expect, it } from "vitest";

describe("lab extraction", () => {
  it("extracts glucose from text line", () => {
    const text = "Glicemia de jejum: 95 mg/dL\nColesterol total: 180 mg/dL";
    const results = extractMarkersFromText(text);
    expect(results.some((r) => r.marker_key === "glucose_fasting")).toBe(true);
  });
});
