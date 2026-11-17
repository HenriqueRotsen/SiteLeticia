import { describe, expect, it } from "vitest";
import {
  formatAddress,
  formatCep,
  googleMapsEmbedUrl,
  googleMapsLink,
  isAddressComplete,
  sanitizeAddress
} from "./location";

const address = {
  placeName: "Clínica Bem Viver",
  cep: "30130-100",
  street: "Av. Afonso Pena",
  number: "1500",
  complement: "Sala 801",
  district: "Centro",
  city: "Belo Horizonte",
  state: "mg"
};

describe("location", () => {
  it("formata o CEP", () => {
    expect(formatCep("30130100")).toBe("30130-100");
    expect(formatCep("301")).toBe("301");
  });

  it("monta o endereço completo em uma linha", () => {
    expect(formatAddress(address)).toBe(
      "Clínica Bem Viver — Av. Afonso Pena, 1500 - Sala 801, Centro, Belo Horizonte - MG, 30130-100"
    );
  });

  it("exige rua, número, cidade e UF", () => {
    expect(isAddressComplete(address)).toBe(true);
    expect(isAddressComplete({ ...address, number: " " })).toBe(false);
  });

  it("gera links do Google Maps sem o nome do local", () => {
    const link = googleMapsLink(formatAddress(address));
    expect(link).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(decodeURIComponent(link)).not.toContain("Clínica");
    expect(decodeURIComponent(googleMapsEmbedUrl(address))).toContain("Av. Afonso Pena, 1500");
  });

  it("limpa campos", () => {
    expect(sanitizeAddress({ cep: "30.130-100", state: "mgx" })).toMatchObject({ cep: "30130100", state: "MG" });
  });
});
