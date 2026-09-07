"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import NutrientAnalysisVisual from "@/components/ui/NutrientAnalysisVisual";
import {
  getEnergyDensityRecommendation,
  getStrategyHint,
  classifyEnergyDensity
} from "@/lib/foods/energy-density";
import { computeMenuAnalysis, sumNutrition } from "@/lib/foods/nutrition";

export default function MealNutrientAnalysis({ mealName, items, patientGoal }) {
  const [open, setOpen] = useState(false);

  const totals = useMemo(() => sumNutrition(items), [items]);
  const analysis = useMemo(() => {
    const totalFoodGrams = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.portionG || 0),
      0
    );

    return computeMenuAnalysis(totals, totalFoodGrams);
  }, [items, totals]);

  const strategyHint = useMemo(() => {
    const recommendation = getEnergyDensityRecommendation(patientGoal);
    return getStrategyHint(classifyEnergyDensity(analysis.caloricDensity), recommendation);
  }, [analysis.caloricDensity, patientGoal]);

  if (!items.length) return null;

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-olive-900/10 bg-linen/20">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-linen/40"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-semibold text-graphite">Análise de nutrientes</p>
          <p className="mt-0.5 text-xs text-graphite/55">
            {analysis.totals.kcal} kcal · densidade{" "}
            {analysis.caloricDensity != null
              ? `${analysis.caloricDensity.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kcal/g`
              : "—"}
          </p>
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-graphite/45 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="border-t border-olive-900/8 px-4 py-4">
          <NutrientAnalysisVisual
            analysis={analysis}
            macrosTitle="Macronutrientes da refeição"
            densityTitle="Densidade calórica da refeição"
            distributionTitle="Distribuição calórica da refeição (% do VET)"
            strategyHint={strategyHint}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
