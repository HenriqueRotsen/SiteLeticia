import { describe, expect, it } from "vitest";
import {
  BMR_FORMULAS,
  ageFromBirthDate,
  computePatientMetabolism,
  computeTmbFaoWho,
  computeTmbHarrisBenedict,
  computeTmbMifflinStJeor,
  computeGet
} from "@/lib/metabolism/bmr";

describe("ageFromBirthDate", () => {
  it("calculates age in full years", () => {
    expect(ageFromBirthDate("1990-06-15", new Date("2026-06-14"))).toBe(35);
    expect(ageFromBirthDate("1990-06-15", new Date("2026-06-15"))).toBe(36);
  });
});

describe("TMB formulas", () => {
  const input = { sex: "female", weightKg: 65, heightCm: 165, ageYears: 35 };

  it("Mifflin-St Jeor", () => {
    expect(computeTmbMifflinStJeor(input)).toBeCloseTo(1345.25, 1);
  });

  it("Harris-Benedict revised", () => {
    expect(computeTmbHarrisBenedict(input)).toBeCloseTo(1408.3, 0);
  });

  it("FAO/WHO adult bracket", () => {
    expect(computeTmbFaoWho(input)).toBeCloseTo(1373.79, 0);
  });
});

describe("computePatientMetabolism", () => {
  it("returns missing fields when incomplete", () => {
    const result = computePatientMetabolism({ sex: "female" });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("peso");
  });

  it("returns all formulas and GET", () => {
    const result = computePatientMetabolism({
      sex: "male",
      weightKg: 80,
      heightCm: 178,
      birthDate: "1988-01-01",
      activityLevel: "moderate"
    });

    expect(result.ok).toBe(true);
    expect(result.formulas[BMR_FORMULAS.MIFFLIN_ST_JEOR]).toBeGreaterThan(1500);
    expect(result.getKcal).toBeGreaterThan(result.tmbKcal);
    expect(computeGet(result.tmbKcal, "moderate")).toBeCloseTo(result.getKcal, 0);
  });
});
