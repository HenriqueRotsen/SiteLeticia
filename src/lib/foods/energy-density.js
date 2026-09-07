export const ENERGY_DENSITY_BANDS = [
  {
    id: "very_low",
    label: "Muito baixa",
    min: 0,
    max: 0.6,
    rangeLabel: "0 a 0,6 kcal/g",
    color: "#bbf7d0"
  },
  {
    id: "low",
    label: "Baixa",
    min: 0.6,
    max: 1.5,
    rangeLabel: "0,6 a 1,5 kcal/g",
    color: "#86efac"
  },
  {
    id: "medium",
    label: "Média",
    min: 1.5,
    max: 3.9,
    rangeLabel: "1,5 a 3,9 kcal/g",
    color: "#4ade80"
  },
  {
    id: "high",
    label: "Alta",
    min: 3.9,
    max: null,
    rangeLabel: "Acima de 3,9 kcal/g",
    color: "#15803d"
  }
];

export const ENERGY_DENSITY_SCALE_MAX = 4.5;

export const ENERGY_DENSITY_EXPLANATION =
  "A densidade energética indica quantas calorias existem em cada grama de alimento. Densidade baixa = mais volume para a mesma energia; densidade alta = menos volume.";

export function classifyEnergyDensity(kcalPerGram) {
  if (kcalPerGram == null || !Number.isFinite(kcalPerGram) || kcalPerGram < 0) {
    return null;
  }

  if (kcalPerGram < 0.6) return { ...ENERGY_DENSITY_BANDS[0] };
  if (kcalPerGram < 1.5) return { ...ENERGY_DENSITY_BANDS[1] };
  if (kcalPerGram <= 3.9) return { ...ENERGY_DENSITY_BANDS[2] };
  return { ...ENERGY_DENSITY_BANDS[3] };
}

export function energyDensityGaugePercent(kcalPerGram, scaleMax = ENERGY_DENSITY_SCALE_MAX) {
  if (kcalPerGram == null || !Number.isFinite(kcalPerGram)) return 0;
  return Math.min(Math.max((kcalPerGram / scaleMax) * 100, 0), 100);
}

export function formatFoodVolume(grams) {
  if (grams == null || !Number.isFinite(grams)) return "—";

  if (grams >= 1000) {
    const kg = grams / 1000;
    return `${kg.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
  }

  return `${Math.round(grams).toLocaleString("pt-BR")} g`;
}

export function volumeForKcal(kcal, kcalPerGram) {
  if (!kcal || !kcalPerGram || kcalPerGram <= 0) return null;
  return kcal / kcalPerGram;
}

export function formatVolumeExample(kcal, kcalPerGram) {
  const grams = volumeForKcal(kcal, kcalPerGram);
  if (grams == null) return null;
  return `${Math.round(kcal).toLocaleString("pt-BR")} kcal → ${formatFoodVolume(grams)} de comida`;
}

export function getEnergyDensityRecommendation(goal) {
  if (!goal) return "balanced";

  if (["Emagrecimento", "Cirurgia Bariátrica", "Saúde intestinal"].includes(goal)) {
    return "lower";
  }

  if (goal === "Hipertrofia") {
    return "higher";
  }

  return "balanced";
}

export function getStrategyHint(classification, recommendation = "balanced") {
  if (!classification) return null;

  const densityId = classification.id;

  if (recommendation === "lower") {
    if (densityId === "very_low" || densityId === "low") {
      return "Boa densidade para estratégias de emagrecimento: o paciente come mais volume com menos calorias.";
    }

    if (densityId === "medium") {
      return "Densidade moderada. Para emagrecimento, vale priorizar alimentos com densidade mais baixa em parte das refeições.";
    }

    return "Densidade elevada. Para emagrecimento, considere incluir mais alimentos volumosos e menos calóricos.";
  }

  if (recommendation === "higher") {
    if (densityId === "high" || densityId === "medium") {
      return "Densidade adequada para ganho de peso ou reintrodução: mais calorias em menor volume.";
    }

    return "Densidade baixa. Para hipertrofia ou ganho de peso, pode ser útil incluir alimentos mais calóricos por grama.";
  }

  return "Use a densidade junto com o objetivo clínico do paciente para ajustar volume e saciedade.";
}

export function formatDensityValue(kcalPerGram) {
  if (kcalPerGram == null || !Number.isFinite(kcalPerGram)) return "—";
  return `${kcalPerGram.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kcal/g`;
}
