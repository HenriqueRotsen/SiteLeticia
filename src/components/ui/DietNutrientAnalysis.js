"use client";

import { useMemo } from "react";
import { Card } from "@/components/layout/AppShell";
import DietClinicalInsight from "@/components/ui/DietClinicalInsight";
import FatSecretNutrientGrid from "@/components/ui/FatSecretNutrientGrid";
import NutrientAnalysisVisual from "@/components/ui/NutrientAnalysisVisual";
import { getClinicalDensityInsight } from "@/lib/foods/energy-density";
import { computeMenuAnalysis, formatKcalValue } from "@/lib/foods/nutrition";

/**
 * Análise do plano — uso clínico (admin). Não renderizar na área do paciente.
 */
export default function DietNutrientAnalysis({
  totals,
  items,
  mealCount = 0,
  itemCount = 0,
  targetKcal = null,
  targetLabel = "Meta (GET)",
  patientGoal = null,
  showClinicalInsights = true
}) {
  const analysis = useMemo(() => {
    const hasUnknownWeight = items.some((item) => item.portionEstimated);
    const totalFoodGrams = hasUnknownWeight
      ? 0
      : items.reduce(
          (sum, item) => sum + Number(item.quantity || 0) * Number(item.portionG || 0),
          0
        );

    return computeMenuAnalysis(totals, totalFoodGrams);
  }, [totals, items]);

  const kcalDiff =
    targetKcal != null ? Math.round((Number(analysis.totals.kcal) || 0) - targetKcal) : null;
  const hasTarget = targetKcal != null && targetKcal > 0;

  const clinicalInsight = useMemo(() => {
    if (!showClinicalInsights) return null;
    return getClinicalDensityInsight({
      density: analysis.caloricDensity,
      goal: patientGoal,
      scope: "plano"
    });
  }, [analysis.caloricDensity, patientGoal, showClinicalInsights]);

  if (!itemCount) {
    return (
      <Card className="mb-4" title="Análise nutricional">
        <p className="py-8 text-center text-sm text-graphite/50">
          Importe o CSV para ver a análise do plano.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden p-0" title="">
      <div className="border-b border-olive-900/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-graphite">Total do plano</h3>
            <p className="mt-1 text-sm text-graphite/55">
              {mealCount} refeições · {itemCount} itens
              {analysis.totalFoodGrams > 0
                ? ` · ${Math.round(analysis.totalFoodGrams)} g`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tabular-nums text-olive-900">
              {formatKcalValue(analysis.totals.kcal)}
            </p>
            {hasTarget ? (
              <p className="mt-1 text-xs text-graphite/55">
                {targetLabel}: {formatKcalValue(targetKcal)}
                {kcalDiff != null ? ` · ${kcalDiff > 0 ? "+" : ""}${kcalDiff}` : ""}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-b border-olive-900/10 px-5 py-5 sm:px-6">
        <FatSecretNutrientGrid totals={analysis.totals} title="Nutrientes do plano" />
      </div>

      {clinicalInsight ? (
        <div className="border-b border-olive-900/10 px-5 py-4 sm:px-6">
          <DietClinicalInsight insight={clinicalInsight} />
        </div>
      ) : null}

      <div className="px-5 py-5 sm:px-6">
        <NutrientAnalysisVisual
          analysis={analysis}
          macrosTitle="Distribuição"
          densityTitle="Densidade"
          distributionTitle="Calorias por macro"
          compact
        />
      </div>
    </Card>
  );
}
