import { describe, expect, it } from "vitest";
import { normalizeWaitlistPhone } from "@/lib/waitlist/position";

describe("normalizeWaitlistPhone", () => {
  it("keeps only digits", () => {
    expect(normalizeWaitlistPhone("(11) 98765-4321")).toBe("11987654321");
  });
});
