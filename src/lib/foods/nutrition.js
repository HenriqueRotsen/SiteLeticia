function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

export const MACRO_NUTRIENTS = [
  { key: "kcal", label: "Energia", unit: "kcal", decimals: 0, alwaysShow: true },
  { key: "protein_g", label: "Proteína", unit: "g", alwaysShow: true },
  { key: "carbs_g", label: "Carboidrato", unit: "g", alwaysShow: true },
  { key: "fat_g", label: "Gordura", unit: "g", alwaysShow: true },
  { key: "fiber_g", label: "Fibra", unit: "g", alwaysShow: true }
];

export const MICRONUTRIENTS = [
  { key: "sodium_mg", label: "Sódio", unit: "mg", decimals: 0 },
  { key: "potassium_mg", label: "Potássio", unit: "mg", decimals: 0 },
  { key: "calcium_mg", label: "Cálcio", unit: "mg", decimals: 0 },
  { key: "magnesium_mg", label: "Magnésio", unit: "mg", decimals: 0 },
  { key: "phosphorus_mg", label: "Fósforo", unit: "mg", decimals: 0 },
  { key: "iron_mg", label: "Ferro", unit: "mg", decimals: 1 },
  { key: "zinc_mg", label: "Zinco", unit: "mg", decimals: 1 },
  { key: "vitamin_a_mcg", label: "Vitamina A", unit: "mcg", decimals: 0 },
  { key: "vitamin_a_iu", label: "Vitamina A", unit: "IU", decimals: 0 },
  { key: "vitamin_c_mg", label: "Vitamina C", unit: "mg", decimals: 0 },
  { key: "vitamin_d_mcg", label: "Vitamina D", unit: "mcg", decimals: 1 },
  { key: "vitamin_b12_mcg", label: "Vitamina B12", unit: "mcg", decimals: 1 },
  { key: "folate_mcg", label: "Folato", unit: "mcg", decimals: 0 }
];

export const ALL_NUTRIENTS = [...MACRO_NUTRIENTS, ...MICRONUTRIENTS];
export const ALL_NUTRIENT_KEYS = ALL_NUTRIENTS.map((nutrient) => nutrient.key);

const NUTRIENT_BY_KEY = Object.fromEntries(ALL_NUTRIENTS.map((nutrient) => [nutrient.key, nutrient]));

function defaultDecimalsForKey(key) {
  if (key === "kcal") return 0;
  if (key.endsWith("_g")) return 1;
  if (key.endsWith("_mg")) return key === "iron_mg" || key === "zinc_mg" ? 1 : 0;
  if (key.endsWith("_mcg")) return 1;
  if (key.endsWith("_iu")) return 0;
  return 1;
}

export function sanitizePer100g(per100g) {
  if (!per100g || typeof per100g !== "object") return per100g;

  const sanitized = {};

  for (const [key, value] of Object.entries(per100g)) {
    if (value == null || value === "") continue;

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) continue;

    const nutrient = NUTRIENT_BY_KEY[key];
    const decimals = nutrient?.decimals ?? defaultDecimalsForKey(key);
    sanitized[key] = round(parsed, decimals);
  }

  return sanitized;
}

export function totalPortionGrams(quantity, portionG) {
  return Number(quantity || 0) * Number(portionG || 0);
}

export function createEmptyNutritionTotals() {
  return Object.fromEntries(ALL_NUTRIENT_KEYS.map((key) => [key, 0]));
}

function scaleValue(value, factor, decimals = 1) {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return round(parsed * factor, decimals);
}

export function scaleNutrition(per100g, totalGrams) {
  if (!per100g || !totalGrams) return null;

  const clean = sanitizePer100g(per100g);
  const factor = totalGrams / 100;
  const scaled = {};

  for (const nutrient of ALL_NUTRIENTS) {
    const value = scaleValue(clean[nutrient.key], factor, nutrient.decimals ?? 1);
    if (value != null) {
      scaled[nutrient.key] = value;
    }
  }

  return scaled.kcal != null ? scaled : null;
}

export function formatPer100g(per100g) {
  const clean = sanitizePer100g(per100g);
  if (!clean?.kcal) return null;

  const parts = [
    `${clean.kcal} kcal / 100g`,
    `P ${clean.protein_g ?? 0}g`,
    `C ${clean.carbs_g ?? 0}g`,
    `G ${clean.fat_g ?? 0}g`
  ];

  if (clean.fiber_g != null) {
    parts.push(`F ${clean.fiber_g}g`);
  }

  return parts.join(" · ");
}

export function formatScaledNutrition(per100g, quantity, portionG) {
  const scaled = scaleNutrition(per100g, totalPortionGrams(quantity, portionG));
  if (!scaled?.kcal) return null;

  const totalG = totalPortionGrams(quantity, portionG);
  const parts = [
    `${scaled.kcal} kcal (${totalG}g)`,
    `P ${scaled.protein_g ?? 0}g`,
    `C ${scaled.carbs_g ?? 0}g`,
    `G ${scaled.fat_g ?? 0}g`
  ];

  if (scaled.fiber_g != null) {
    parts.push(`F ${scaled.fiber_g}g`);
  }

  return parts.join(" · ");
}

export function sumNutrition(items) {
  return items.reduce((acc, item) => {
    const scaled = scaleNutrition(item.per100g, totalPortionGrams(item.quantity, item.portionG));
    if (!scaled) return acc;

    for (const key of ALL_NUTRIENT_KEYS) {
      if (scaled[key] != null) {
        acc[key] += scaled[key];
      }
    }

    return acc;
  }, createEmptyNutritionTotals());
}

export function finalizeNutritionTotals(totals) {
  const finalized = { ...totals };

  for (const nutrient of ALL_NUTRIENTS) {
    finalized[nutrient.key] = round(finalized[nutrient.key], nutrient.decimals ?? 1);
  }

  return finalized;
}

export function formatNutrientValue(key, value) {
  const nutrient = NUTRIENT_BY_KEY[key];
  if (!nutrient || value == null) return "—";

  const formatted = round(value, nutrient.decimals ?? 1);
  return `${formatted} ${nutrient.unit}`;
}

export function formatNutritionTotals(totals) {
  const finalized = finalizeNutritionTotals(totals);
  const parts = [
    `${finalized.kcal} kcal`,
    `P ${finalized.protein_g}g`,
    `C ${finalized.carbs_g}g`,
    `G ${finalized.fat_g}g`,
    `F ${finalized.fiber_g}g`
  ];

  return parts.join(" · ");
}

export function getVisibleNutrients(totals, nutrientList = ALL_NUTRIENTS) {
  return nutrientList.filter((nutrient) => {
    if (nutrient.alwaysShow) return true;
    return Number(totals[nutrient.key] || 0) > 0;
  });
}

export function hasMicronutrientTotals(totals) {
  return MICRONUTRIENTS.some((nutrient) => Number(totals[nutrient.key] || 0) > 0);
}

export function sumTotalFoodGrams(items) {
  return round(
    items.reduce((total, item) => total + totalPortionGrams(item.quantity, item.portionG), 0),
    0
  );
}

export function computeMenuAnalysis(totals, totalFoodGrams = 0) {
  const finalized = finalizeNutritionTotals(totals);
  const proteinKcal = finalized.protein_g * 4;
  const carbsKcal = finalized.carbs_g * 4;
  const fatKcal = finalized.fat_g * 9;
  const macroKcalSum = proteinKcal + carbsKcal + fatKcal;
  const freeCarbsG = Math.max(finalized.carbs_g - finalized.fiber_g, 0);

  const percent = (kcal) =>
    macroKcalSum > 0 ? round((kcal / macroKcalSum) * 100, 1) : 0;

  return {
    totals: finalized,
    totalFoodGrams,
    freeCarbsG: round(freeCarbsG, 1),
    caloricDensity:
      totalFoodGrams > 0 ? round(finalized.kcal / totalFoodGrams, 2) : null,
    macros: {
      protein: {
        label: "Proteínas",
        grams: finalized.protein_g,
        kcal: round(proteinKcal, 0),
        percent: percent(proteinKcal),
        color: "#b84a3a"
      },
      carbs: {
        label: "Carboidratos",
        grams: finalized.carbs_g,
        kcal: round(carbsKcal, 0),
        percent: percent(carbsKcal),
        color: "#4a6fa5"
      },
      fat: {
        label: "Gorduras",
        grams: finalized.fat_g,
        kcal: round(fatKcal, 0),
        percent: percent(fatKcal),
        color: "#c4933a"
      }
    },
    chartData: [
      { name: "Proteínas", value: round(proteinKcal, 0), color: "#b84a3a" },
      { name: "Carboidratos", value: round(carbsKcal, 0), color: "#4a6fa5" },
      { name: "Gorduras", value: round(fatKcal, 0), color: "#c4933a" }
    ].filter((entry) => entry.value > 0)
  };
}

export function formatGrams(value) {
  return `${round(value, 1)} g`;
}

export function formatKcalValue(value) {
  return `${round(value, 0)} kcal`;
}
