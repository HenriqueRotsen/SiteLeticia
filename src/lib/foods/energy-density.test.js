import { describe, expect, it } from "vitest";
import {
  classifyEnergyDensity,
  energyDensityGaugePercent,
  formatVolumeExample,
  getClinicalDensityInsight,
  getStrategyHint,
  volumeForKcal
} from "@/lib/foods/energy-density";

describe("energy density", () => {
  it("classifies density bands", () => {
    expect(classifyEnergyDensity(0.5)?.id).toBe("very_low");
    expect(classifyEnergyDensity(1.38)?.id).toBe("low");
    expect(classifyEnergyDensity(1.5)?.id).toBe("medium");
    expect(classifyEnergyDensity(4)?.id).toBe("high");
  });

  it("calculates food volume from kcal and density", () => {
    expect(volumeForKcal(2000, 0.8)).toBe(2500);
    expect(volumeForKcal(2000, 1.6)).toBe(1250);
    expect(formatVolumeExample(2000, 0.8)).toContain("2,5 kg");
  });

  it("positions gauge marker", () => {
    expect(energyDensityGaugePercent(1.38)).toBeCloseTo(30.67, 1);
  });

  it("returns strategy hints", () => {
    const low = classifyEnergyDensity(1.1);
    expect(getStrategyHint(low, "lower")).toMatch(/emagrecimento/i);
  });

  it("builds clinical density insight for nutritionist", () => {
    const insight = getClinicalDensityInsight({
      density: 1.1,
      goal: "Hipertrofia",
      scope: "plano"
    });

    expect(insight.eyebrow).toBe("Insight clínico");
    expect(insight.tone).toBe("watch");
    expect(insight.body).toMatch(/hipertrofia|calóricos/i);
  });
});
