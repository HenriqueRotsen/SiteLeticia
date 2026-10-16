import { describe, expect, it } from "vitest";
import { amountsMatch, buildDocumentRowFromExtraction } from "@/lib/payments/extract-receipt";

describe("amountsMatch", () => {
  it("aceita diferença dentro da tolerância", () => {
    expect(amountsMatch(25000, 25050)).toBe(true);
    expect(amountsMatch(25000, 24950)).toBe(true);
  });

  it("rejeita diferença acima da tolerância", () => {
    expect(amountsMatch(25000, 25100)).toBe(false);
  });

  it("retorna null quando falta valor", () => {
    expect(amountsMatch(null, 25000)).toBe(null);
    expect(amountsMatch(25000, null)).toBe(null);
  });
});

describe("buildDocumentRowFromExtraction", () => {
  it("marca ok quando há valor e confere", () => {
    const row = buildDocumentRowFromExtraction(
      {
        amountCents: 25000,
        paidAt: "2026-01-01T12:00:00.000Z",
        payerName: "Maria",
        confidence: 0.9,
        method: "heuristic",
        rawText: "R$ 250,00"
      },
      25000
    );

    expect(row.extraction_status).toBe("ok");
    expect(row.amount_matches).toBe(true);
    expect(row.extracted_amount_cents).toBe(25000);
  });
});
