export const MEASURE_UNITS = [
  {
    id: "gramas",
    label: "Gramas (g)",
    gramsPerUnit: 1,
    singular: "g",
    plural: "g",
    step: 1,
    min: 1
  },
  {
    id: "ml",
    label: "Mililitros (ml)",
    gramsPerUnit: 1,
    singular: "ml",
    plural: "ml",
    step: 1,
    min: 1
  },
  {
    id: "litros",
    label: "Litros (L)",
    gramsPerUnit: 1000,
    singular: "L",
    plural: "L",
    step: 0.1,
    min: 0.1
  },
  {
    id: "colher_sopa",
    label: "Colher de sopa",
    gramsPerUnit: 15,
    singular: "colher de sopa",
    plural: "colheres de sopa",
    step: 0.5,
    min: 0.5
  },
  {
    id: "colher_sobremesa",
    label: "Colher de sobremesa",
    gramsPerUnit: 7.5,
    singular: "colher de sobremesa",
    plural: "colheres de sobremesa",
    step: 0.5,
    min: 0.5
  },
  {
    id: "colher_cafe",
    label: "Colher de café",
    gramsPerUnit: 3,
    singular: "colher de café",
    plural: "colheres de café",
    step: 0.5,
    min: 0.5
  },
  {
    id: "colher_cha",
    label: "Colher de chá",
    gramsPerUnit: 5,
    singular: "colher de chá",
    plural: "colheres de chá",
    step: 0.5,
    min: 0.5
  }
];

const MEASURE_BY_ID = Object.fromEntries(MEASURE_UNITS.map((unit) => [unit.id, unit]));

export function getMeasureUnit(id) {
  return MEASURE_BY_ID[id] || MEASURE_BY_ID.gramas;
}

function isAbsoluteAmountUnit(measureUnit) {
  return measureUnit === "gramas" || measureUnit === "ml" || measureUnit === "litros";
}

export function normalizeMeasureAmount(measureUnit, value) {
  const unit = getMeasureUnit(measureUnit);
  const parsed = Number(value);
  const amount = Number.isFinite(parsed) ? parsed : unit.min;
  return Math.max(unit.min, amount);
}

export function toStoredPortion(measureUnit, measureAmount) {
  const unit = getMeasureUnit(measureUnit);
  const amount = normalizeMeasureAmount(measureUnit, measureAmount);

  if (isAbsoluteAmountUnit(measureUnit)) {
    const portionG = measureUnit === "litros" ? amount * 1000 : amount;
    return { quantity: 1, portionG, measureUnit, measureAmount: amount };
  }

  return {
    quantity: amount,
    portionG: unit.gramsPerUnit,
    measureUnit,
    measureAmount: amount
  };
}

export function extractPer100g(snapshot) {
  if (!snapshot || snapshot.kcal == null) return null;

  const { measureUnit, measureAmount, ...nutrition } = snapshot;
  return nutrition.kcal != null ? nutrition : null;
}

export function restoreMeasureFromStored(quantity, portionG, snapshot) {
  const per100g = extractPer100g(snapshot) || snapshot;

  if (snapshot?.measureUnit && snapshot?.measureAmount != null) {
    const stored = toStoredPortion(snapshot.measureUnit, snapshot.measureAmount);
    return { ...stored, per100g };
  }

  const qty = Number(quantity) || 1;
  const portion = Number(portionG) || 100;

  if (qty === 1) {
    return { ...toStoredPortion("gramas", portion), per100g };
  }

  for (const unit of MEASURE_UNITS) {
    if (isAbsoluteAmountUnit(unit.id)) continue;
    if (Math.abs(portion - unit.gramsPerUnit) < 0.01) {
      return { ...toStoredPortion(unit.id, qty), per100g };
    }
  }

  return { ...toStoredPortion("gramas", qty * portion), per100g };
}

export function formatMeasureLabel(measureUnit, measureAmount) {
  const amount = normalizeMeasureAmount(measureUnit, measureAmount);

  if (measureUnit === "gramas") {
    return `${amount}g`;
  }

  if (measureUnit === "ml") {
    return `${amount} ml`;
  }

  if (measureUnit === "litros") {
    const ml = amount * 1000;
    return `${amount} L (${ml} ml)`;
  }

  const unit = getMeasureUnit(measureUnit);
  const label = amount === 1 ? unit.singular : unit.plural;
  const totalG = amount * unit.gramsPerUnit;
  return `${amount} ${label} (${totalG}g)`;
}

export function measureQuantityLabel(measureUnit) {
  if (measureUnit === "gramas") return "Quantidade (g)";
  if (measureUnit === "ml") return "Quantidade (ml)";
  if (measureUnit === "litros") return "Quantidade (L)";
  return "Quantidade";
}

export function buildNutritionSnapshot(per100g, measureUnit, measureAmount) {
  if (!per100g) return null;
  return {
    ...per100g,
    measureUnit,
    measureAmount: normalizeMeasureAmount(measureUnit, measureAmount)
  };
}
