import { describe, expect, it } from "vitest";
import { patientSearchFilter, waitlistPositions } from "@/lib/waitlist/patient-search";

describe("patientSearchFilter", () => {
  it("returns null for empty input", () => {
    expect(patientSearchFilter("  ")).toBeNull();
  });

  it("searches formatted phones by their digits", () => {
    const filter = patientSearchFilter("(61) 99177-4192");
    expect(filter).toContain("phone.ilike.*61991774192*");
    expect(filter).not.toMatch(/[()]/);
  });

  it("drops the Brazil country code", () => {
    expect(patientSearchFilter("+55 61 99177-4192")).toContain("phone.ilike.*61991774192*");
  });

  it("searches names without a phone condition", () => {
    expect(patientSearchFilter("Valcilene")).toBe("full_name.ilike.*Valcilene*");
  });

  it("strips characters that break the filter", () => {
    expect(patientSearchFilter("Ana, (teste)")).toBe("full_name.ilike.*Ana teste*");
  });
});

describe("waitlistPositions", () => {
  it("counts only waiting entries in signup order", () => {
    const map = waitlistPositions([
      { id: 9, status: "waiting" },
      { id: 3, status: "waiting" },
      { id: 5, status: "called" },
      { id: 12, status: "waiting" }
    ]);
    expect(map.get(3).position).toBe(1);
    expect(map.get(5)).toMatchObject({ status: "called", position: null });
    expect(map.get(9).position).toBe(2);
    expect(map.get(12).position).toBe(3);
  });
});
