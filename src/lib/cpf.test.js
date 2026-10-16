import { describe, expect, it } from "vitest";
import { formatCpf, isValidCpf, maskCpf, normalizeCpf } from "@/lib/cpf-utils";
import { blockedUntil, overlapsWithBuffer } from "@/lib/scheduling/slots";
import { CONSULTATION_DURATION_MIN, SLOT_INTERVAL_MIN } from "@/lib/constants";

describe("cpf", () => {
  it("validates known valid CPF", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
  });

  it("rejects invalid CPF", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
  });

  it("masks CPF", () => {
    expect(maskCpf("52998224725")).toBe("***.982.247-**");
  });

  it("normalizes digits", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
  });

  it("formats CPF progressively", () => {
    expect(formatCpf("529")).toBe("529");
    expect(formatCpf("529982")).toBe("529.982");
    expect(formatCpf("529982247")).toBe("529.982.247");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });
});

describe("scheduling", () => {
  it("blocks next slot until 75 minutes after start", () => {
    const start = new Date("2026-01-01T10:00:00.000Z");
    const blocked = blockedUntil(start);
    expect(blocked.getTime() - start.getTime()).toBe(SLOT_INTERVAL_MIN * 60 * 1000);
  });

  it("detects overlap with buffer", () => {
    const existing = new Date("2026-01-01T10:00:00.000Z");
    const candidate = new Date("2026-01-01T11:00:00.000Z");
    expect(overlapsWithBuffer(existing, candidate)).toBe(true);
    const ok = new Date("2026-01-01T11:15:00.000Z");
    expect(overlapsWithBuffer(existing, ok)).toBe(false);
  });

  it("uses 60 minute consultation duration constant", () => {
    expect(CONSULTATION_DURATION_MIN).toBe(60);
  });
});
