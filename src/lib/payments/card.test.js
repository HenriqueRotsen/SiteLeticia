import { describe, expect, it } from "vitest";
import {
  consultationPaymentOptions,
  effectiveFeePercent,
  effectiveInstallments,
  installmentCents,
  isValidPaymentLink,
  normalizePaymentLink,
  packagePaymentOptions,
  pickOption,
  suggestCardPriceCents
} from "@/lib/payments/card";

describe("suggestCardPriceCents", () => {
  it("passes the fee on so the net value equals the PIX price", () => {
    // 400 / (1 − 0,0499) = 421,01 → R$ 430 (para cima, de R$ 10 em R$ 10)
    expect(suggestCardPriceCents(40000, 4.99)).toBe(43000);
    expect(suggestCardPriceCents(108000, 4.99)).toBe(114000);
  });

  it("matches the 2027 pricing sheet", () => {
    // Tap to Pay: à vista 3,09%, 3x 6,09%, 6x 8,19%
    expect(suggestCardPriceCents(40000, 3.09)).toBe(42000);
    expect(suggestCardPriceCents(108000, 6.09)).toBe(116000);
    expect(suggestCardPriceCents(204000, 8.19)).toBe(223000);
    // Link de pagamento: 3x 6,99%, 6x 9,59%
    expect(suggestCardPriceCents(108000, 6.99)).toBe(117000);
    expect(suggestCardPriceCents(204000, 9.59)).toBe(226000);
  });

  it("does not round up an exact multiple", () => {
    expect(suggestCardPriceCents(95000, 5)).toBe(100000);
  });

  it("keeps the PIX price without fee", () => {
    expect(suggestCardPriceCents(40000, 0)).toBe(40000);
    expect(suggestCardPriceCents(0, 5)).toBe(0);
  });
});

describe("installmentCents", () => {
  it("rounds each installment up", () => {
    expect(installmentCents(42100, 3)).toBe(14034);
    expect(installmentCents(42100, 0)).toBe(42100);
  });
});

describe("payment links", () => {
  it("accepts only https links", () => {
    expect(normalizePaymentLink(" https://link.mercadopago.com.br/leticia ")).toBe("https://link.mercadopago.com.br/leticia");
    expect(normalizePaymentLink("http://exemplo.com")).toBeNull();
    expect(normalizePaymentLink("javascript:alert(1)")).toBeNull();
    expect(isValidPaymentLink("")).toBe(true);
    expect(isValidPaymentLink("nao é link")).toBe(false);
  });
});

describe("payment options", () => {
  const settings = {
    consultation_price_cents: 40000,
    consultation_pix_code: "PIX",
    consultation_card_link: "https://pagar.exemplo/consulta",
    card_fee_percent: 4.99,
    card_max_installments: 3
  };

  it("offers card only with a link", () => {
    expect(consultationPaymentOptions({ ...settings, consultation_card_link: "" }).map((o) => o.method)).toEqual(["pix"]);
    const options = consultationPaymentOptions(settings);
    expect(options.map((o) => o.method)).toEqual(["pix", "card"]);
    expect(pickOption(options, "card")).toMatchObject({ cents: 43000, installments: 3, installmentCents: 14334 });
  });

  it("uses the price Letícia typed when there is one", () => {
    const options = packagePaymentOptions(
      { price_cents: 108000, card_price_cents: 115000, card_link: "https://pagar.exemplo/pacote" },
      settings
    );
    expect(pickOption(options, "card").cents).toBe(115000);
    expect(pickOption(options, "boleto").method).toBe("pix");
  });
});

describe("per-product card terms", () => {
  const settings = { card_fee_percent: 4.99, card_max_installments: 3 };

  it("falls back to the general fee and installments", () => {
    expect(effectiveFeePercent(null, 4.99)).toBe(4.99);
    expect(effectiveFeePercent("", 4.99)).toBe(4.99);
    expect(effectiveFeePercent(0, 4.99)).toBe(0);
    expect(effectiveInstallments(null, 3)).toBe(3);
    expect(effectiveInstallments(6, 3)).toBe(6);
  });

  it("uses each product's own fee and installments", () => {
    const consult = pickOption(
      consultationPaymentOptions({
        ...settings,
        consultation_price_cents: 40000,
        consultation_card_link: "https://pagar.exemplo/consulta",
        consultation_card_fee_percent: 3.09,
        consultation_card_installments: 1
      }),
      "card"
    );
    expect(consult).toMatchObject({ cents: 42000, installments: 1 });

    const plan = pickOption(
      packagePaymentOptions(
        { price_cents: 204000, card_link: "https://pagar.exemplo/6m", card_fee_percent: 9.59, card_installments: 6 },
        settings
      ),
      "card"
    );
    expect(plan).toMatchObject({ cents: 226000, installments: 6, installmentCents: 37667 });
  });
});
