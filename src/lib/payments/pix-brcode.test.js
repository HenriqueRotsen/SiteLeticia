import { describe, expect, it } from "vitest";
import { crc16, describePixCode, parsePixCode, pixCodeForAmount } from "./pix-brcode";

function field(id, value) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function buildCode({ amount = "250.00", key = "leticia@example.com" } = {}) {
  const account = field("00", "br.gov.bcb.pix") + field("01", key);
  const body =
    field("00", "01") +
    field("26", account) +
    field("52", "0000") +
    field("53", "986") +
    (amount ? field("54", amount) : "") +
    field("58", "BR") +
    field("59", "LETICIA CUNHA") +
    field("60", "BELO HORIZONTE") +
    field("62", field("05", "***")) +
    "6304";
  return body + crc16(body);
}

describe("pix copia e cola", () => {
  it("lê valor e recebedor de um código válido", () => {
    const parsed = parsePixCode(buildCode());
    expect(parsed).toMatchObject({ valid: true, amountCents: 25000, merchantName: "LETICIA CUNHA" });
  });

  it("recusa código cortado ou alterado", () => {
    const code = buildCode();
    expect(parsePixCode(code.slice(0, -3)).valid).toBe(false);
    expect(parsePixCode(code.replace("250.00", "150.00")).valid).toBe(false);
    expect(parsePixCode("chave-aleatoria").valid).toBe(false);
  });

  it("confere o valor com o preço", () => {
    expect(describePixCode(buildCode(), 25000).tone).toBe("success");
    expect(describePixCode(buildCode(), 30000).tone).toBe("error");
    expect(describePixCode(buildCode({ amount: "" }), 25000).tone).toBe("warning");
    expect(pixCodeForAmount(buildCode(), 30000)).toBeNull();
    expect(pixCodeForAmount(buildCode({ amount: "" }), 30000)).toBeTruthy();
  });
});
