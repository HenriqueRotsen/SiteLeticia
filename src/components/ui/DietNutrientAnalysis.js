"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/layout/AppShell";
import NutrientAnalysisVisual from "@/components/ui/NutrientAnalysisVisual";
import {
  ENERGY_DENSITY_EXPLANATION,
  classifyEnergyDensity,
  formatVolumeExample,
  getEnergyDensityRecommendation,
  getStrategyHint
} from "@/lib/foods/energy-density";
import {
  MICRONUTRIENTS,
  computeMenuAnalysis,
  formatGrams,
  formatKcalValue,
  formatNutrientValue,
  getVisibleNutrients,
  hasMicronutrientTotals
} from "@/lib/foods/nutrition";

function AnalysisRow({ label, value, meta, diff, showTargetColumns }) {
  return (
    <tr className="border-b border-olive-900/5 last:border-0">
      <td className="py-2.5 pr-3 text-sm text-graphite/75">{label}</td>
      <td className="py-2.5 px-3 text-right text-sm font-medium text-graphite">{value}</td>
      {showTargetColumns ? (
        <>
          <td className="py-2.5 px-3 text-right text-sm text-graphite/55">{meta ?? "—"}</td>
          <td
            className={`py-2.5 pl-3 text-right text-sm font-medium ${
              diff == null
                ? "text-graphite/40"
                : diff > 0
                  ? "text-amber-800"
                  : diff < 0
                    ? "text-olive-800"
                    : "text-graphite/50"
            }`}
          >
            {diff == null ? "—" : `${diff > 0 ? "+" : ""}${diff} kcal`}
          </td>
        </>
      ) : null}
    </tr>
  );
}

export default function DietNutrientAnalysis({
  totals,
  items,
  mealCount = 0,
  itemCount = 0,
  targetKcal = null,
  targetLabel = "Meta (GET)",
  patientGoal = null
}) {
  const [showMicros, setShowMicros] = useState(false);

  const analysis = useMemo(() => {
    const totalFoodGrams = items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.portionG || 0),
      0
    );

    return computeMenuAnalysis(totals, totalFoodGrams);
  }, [totals, items]);

  const visibleMicros = getVisibleNutrients(analysis.totals, MICRONUTRIENTS);
  const showMicroSection = hasMicronutrientTotals(analysis.totals);
  const kcalDiff =
    targetKcal != null ? Math.round(analysis.totals.kcal - targetKcal) : null;
  const hasTarget = targetKcal != null && targetKcal > 0;
  const densityClass = classifyEnergyDensity(analysis.caloricDensity);
  const strategyHint = getStrategyHint(
    densityClass,
    getEnergyDensityRecommendation(patientGoal)
  );

  if (!itemCount) {
    return (
      <Card className="mb-4" title="Análise de nutrientes do cardápio">
        <p className="py-8 text-center text-sm text-graphite/50">
          Adicione alimentos ao plano para ver a análise nutricional.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-4 overflow-hidden p-0" title="">
      <div className="border-b border-olive-900/10 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-graphite">Análise de nutrientes do cardápio</h3>
            <p className="mt-1 text-sm text-graphite/55">
              {itemCount} item(ns) · {mealCount} refeição(ões) · {Math.round(analysis.totalFoodGrams)} g de alimentos
            </p>
          </div>
          {showMicroSection ? (
            <button
              type="button"
              onClick={() => setShowMicros((current) => !current)}
              className="rounded-xl border border-olive-900/10 bg-white px-3 py-2 text-sm font-medium text-graphite/70 hover:bg-linen"
            >
              {showMicros ? "Ocultar micronutrientes" : "Ver todos os nutrientes"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-b border-olive-900/10 bg-linen/20 px-5 py-4 sm:px-6">
        <p className="text-sm font-semibold text-graphite">Densidade energética</p>
        <p className="mt-2 text-sm leading-6 text-graphite/65">{ENERGY_DENSITY_EXPLANATION}</p>
        <div className="mt-3 grid gap-2 text-xs text-graphite/60 sm:grid-cols-2">
          <p>Exemplo: {formatVolumeExample(2000, 0.8)}</p>
          <p>Exemplo: {formatVolumeExample(2000, 1.6)}</p>
        </div>
        <p className="mt-3 text-xs leading-5 text-graphite/55">
          Emagrecimento: prefira densidade mais baixa. Ganho de peso ou reintrodução alimentar: densidade mais alta.
        </p>
      </div>

      <div className="border-b border-olive-900/10 px-5 py-5 sm:px-6">
        <NutrientAnalysisVisual
          analysis={analysis}
          macrosTitle="Macronutrientes do plano"
          densityTitle="Densidade calórica do plano"
          distributionTitle="Distribuição calórica do plano (% do VET)"
          strategyHint={strategyHint}
        />
      </div>

      <div className="overflow-x-auto px-5 py-5 sm:px-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-olive-900/10 text-left text-xs font-semibold uppercase tracking-wide text-graphite/45">
                <th className="pb-2 pr-3">Parâmetro</th>
                <th className="pb-2 px-3 text-right">Prescrito</th>
                {hasTarget ? <th className="pb-2 px-3 text-right">{targetLabel}</th> : null}
                {hasTarget ? <th className="pb-2 pl-3 text-right">Diferença</th> : null}
              </tr>
            </thead>
            <tbody>
              <AnalysisRow
                label="Proteínas totais"
                value={formatGrams(analysis.totals.protein_g)}
                showTargetColumns={hasTarget}
              />
              <AnalysisRow
                label="Gorduras totais"
                value={formatGrams(analysis.totals.fat_g)}
                showTargetColumns={hasTarget}
              />
              <AnalysisRow
                label="Carboidratos totais"
                value={formatGrams(analysis.totals.carbs_g)}
                showTargetColumns={hasTarget}
              />
              <AnalysisRow
                label="Fibras totais"
                value={formatGrams(analysis.totals.fiber_g)}
                showTargetColumns={hasTarget}
              />
              <AnalysisRow
                label="Carboidratos livres"
                value={formatGrams(analysis.freeCarbsG)}
                showTargetColumns={hasTarget}
              />
              <AnalysisRow
                label="Calorias totais"
                value={formatKcalValue(analysis.totals.kcal)}
                meta={hasTarget ? formatKcalValue(targetKcal) : null}
                diff={hasTarget ? kcalDiff : null}
                showTargetColumns={hasTarget}
              />
              <AnalysisRow
                label="Densidade calórica"
                value={
                  analysis.caloricDensity != null
                    ? `${analysis.caloricDensity} kcal/g`
                    : "—"
                }
                showTargetColumns={hasTarget}
              />
            </tbody>
          </table>
      </div>

      {showMicros && showMicroSection ? (
        <div className="border-t border-olive-900/10 bg-linen/30 px-5 py-4 sm:px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-graphite/45">
            Micronutrientes
          </p>
          <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {visibleMicros.map((nutrient) => (
              <div
                key={nutrient.key}
                className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-sm"
              >
                <dt className="text-graphite/65">{nutrient.label}</dt>
                <dd className="font-medium text-graphite">
                  {formatNutrientValue(nutrient.key, analysis.totals[nutrient.key])}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="border-t border-olive-900/10 bg-olive-800 px-5 py-3 text-sm text-porcelain sm:px-6">
        <span className="font-medium">Resumo · </span>
        Proteínas: {formatGrams(analysis.totals.protein_g)} · Gorduras:{" "}
        {formatGrams(analysis.totals.fat_g)} · Carboidratos: {formatGrams(analysis.totals.carbs_g)} ·
        Calorias: {formatKcalValue(analysis.totals.kcal)}
        {densityClass ? (
          <span className="text-porcelain/75">
            {" "}
            · Densidade: {analysis.caloricDensity} kcal/g ({densityClass.label.toLowerCase()})
          </span>
        ) : null}
        {hasTarget ? (
          <span className="text-porcelain/75">
            {" "}
            · {targetLabel}: {formatKcalValue(targetKcal)}
            {kcalDiff != null ? ` (${kcalDiff > 0 ? "+" : ""}${kcalDiff} kcal)` : ""}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
