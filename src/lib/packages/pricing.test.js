import { describe, expect, it } from "vitest";
import { packageSavings, perSessionCents, pickUsablePackage, priceFromDiscount, remainingSessions } from "./pricing";

describe("pacotes", () => {
  it("calcula desconto em relação às consultas avulsas", () => {
    expect(packageSavings({ sessions: 4, price_cents: 80000 }, 25000)).toEqual({
      savingsCents: 20000,
      discountPercent: 20,
      regularTotalCents: 100000
    });
    expect(packageSavings({ sessions: 4, price_cents: 120000 }, 25000).discountPercent).toBe(0);
  });

  it("preço por consulta e preço a partir do desconto", () => {
    expect(perSessionCents({ sessions: 3, price_cents: 60000 })).toBe(20000);
    expect(priceFromDiscount(4, 25000, 15)).toBe(85000);
  });

  it("usa o pacote pago mais antigo com saldo", () => {
    const list = [
      { id: "a", payment_status: "paid", sessions_total: 4, sessions_used: 4, paid_at: "2026-01-01" },
      { id: "b", payment_status: "pending", sessions_total: 4, sessions_used: 0 },
      { id: "c", payment_status: "paid", sessions_total: 4, sessions_used: 1, paid_at: "2026-03-01" },
      { id: "d", payment_status: "paid", sessions_total: 4, sessions_used: 0, paid_at: "2026-02-01" }
    ];
    expect(pickUsablePackage(list).id).toBe("d");
    expect(remainingSessions(list[2])).toBe(3);
  });
});
