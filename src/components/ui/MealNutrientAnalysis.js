"use client";

import { useMemo } from "react";
import FatSecretNutrientGrid from "@/components/ui/FatSecretNutrientGrid";
import { computeMenuAnalysis, formatKcalValue, sumNutrition } from "@/lib/foods/nutrition";

/**
 * Total de nutrientes da refeição — sempre visível, agrupado sob os alimentos.
 * Insights clínicos ficam só no total do plano (admin).
 */
export default function MealNutrientAnalysis({ mealName, items }) {
  const totals = useMemo(() => sumNutrition(items), [items]);
  const analysis = useMemo(() => {
    const totalFoodGrams = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.portionG || 0),
      0
    );

    return computeMenuAnalysis(totals, totalFoodGrams);
  }, [items, totals]);

  if (!items.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-olive-900/10 bg-gradient-to-br from-linen/80 to-olive-50/40 px-4 py-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-graphite">Total da refeição</p>
          <p className="mt-0.5 text-xs text-graphite/55">{mealName}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-olive-900">
            {formatKcalValue(analysis.totals.kcal)}
          </p>
          {analysis.caloricDensity != null ? (
            <p className="text-[11px] text-graphite/50">
              {analysis.caloricDensity.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}{" "}
              kcal/g
            </p>
          ) : null}
        </div>
      </div>

      <FatSecretNutrientGrid totals={analysis.totals} title={null} compact />
    </div>
  );
}
