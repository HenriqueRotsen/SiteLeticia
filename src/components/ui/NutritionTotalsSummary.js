"use client";

import {
  MACRO_NUTRIENTS,
  MICRONUTRIENTS,
  finalizeNutritionTotals,
  formatNutrientValue,
  getVisibleNutrients,
  hasMicronutrientTotals
} from "@/lib/foods/nutrition";

function NutrientGrid({ nutrients, totals }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {nutrients.map((nutrient) => (
        <div
          key={nutrient.key}
          className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm"
        >
          <dt className="text-graphite/65">{nutrient.label}</dt>
          <dd className="font-medium text-graphite">{formatNutrientValue(nutrient.key, totals[nutrient.key])}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function NutritionTotalsSummary({ totals, title = "Totais nutricionais", compact = false }) {
  const finalized = finalizeNutritionTotals(totals);
  const visibleMacros = getVisibleNutrients(finalized, MACRO_NUTRIENTS);
  const visibleMicros = getVisibleNutrients(finalized, MICRONUTRIENTS);
  const showMicros = hasMicronutrientTotals(finalized);

  if (compact) {
    return (
      <div className="mt-4 border-t border-olive-900/5 pt-3">
        <p className="text-sm font-medium text-graphite">{title}</p>
        <p className="mt-1 text-sm text-olive-900">
          {visibleMacros
            .map((nutrient) => `${nutrient.label}: ${formatNutrientValue(nutrient.key, finalized[nutrient.key])}`)
            .join(" · ")}
        </p>
        {showMicros ? (
          <p className="mt-2 text-xs text-graphite/60">
            {visibleMicros
              .map((nutrient) => `${nutrient.label}: ${formatNutrientValue(nutrient.key, finalized[nutrient.key])}`)
              .join(" · ")}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-graphite">{title}</h4>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/45">Macronutrientes</p>
        <NutrientGrid nutrients={visibleMacros} totals={finalized} />
      </div>

      {showMicros ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/45">Micronutrientes</p>
          <NutrientGrid nutrients={visibleMicros} totals={finalized} />
        </div>
      ) : (
        <p className="text-xs text-graphite/50">
          Micronutrientes aparecem quando os alimentos informarem esses dados.
        </p>
      )}
    </div>
  );
}
