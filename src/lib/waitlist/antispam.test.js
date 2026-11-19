import { describe, expect, it } from "vitest";
import { antiSpamDecision } from "./antispam";

const base = { honeypot: false, elapsedMs: 8000 };

describe("proteção anti-spam da lista de espera", () => {
  it("aceita quem passa no reCAPTCHA", () => {
    expect(antiSpamDecision({ ...base, recaptcha: { status: "pass" }, ip: "a" }).ok).toBe(true);
  });

  it("aceita nota baixa ou sem token quando o resto confere", () => {
    expect(antiSpamDecision({ ...base, recaptcha: { status: "unsure" }, ip: "b" }).ok).toBe(true);
  });

  it("bloqueia campo isca, nota de robô e envio rápido demais", () => {
    expect(antiSpamDecision({ ...base, honeypot: true, recaptcha: { status: "pass" }, ip: "c" }).ok).toBe(false);
    expect(antiSpamDecision({ ...base, recaptcha: { status: "bot" }, ip: "d" }).ok).toBe(false);
    expect(antiSpamDecision({ ...base, elapsedMs: 800, recaptcha: { status: "unsure" }, ip: "e" }).ok).toBe(false);
  });

  it("limita tentativas duvidosas por conexão", () => {
    const results = Array.from({ length: 7 }, () =>
      antiSpamDecision({ ...base, recaptcha: { status: "unsure" }, ip: "f" }).ok
    );
    expect(results.filter(Boolean)).toHaveLength(5);
  });
});
