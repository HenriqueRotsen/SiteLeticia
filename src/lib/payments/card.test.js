import { describe, expect, it } from "vitest";
import {
  consultationPaymentOptions,
  installmentCents,
  isValidPaymentLink,
  normalizePaymentLink,
  packagePaymentOptions,
  pickOption,
  suggestCardPriceCents
} from "@/lib/payments/card";

describe("suggestCardPriceCents", () => {
  it("passes the fee on so the net value equals the PIX price", () => {
    // 400 / (1 − 0,0499) = 421,01 → R$ 422 (sempre para cima)
    expect(suggestCardPriceCents(40000, 4.99)).toBe(42200);
    expect(suggestCardPriceCents(108000, 4.99)).toBe(113700);
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
    expect(pickOption(options, "card")).toMatchObject({ cents: 42200, installments: 3, installmentCents: 14067 });
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
