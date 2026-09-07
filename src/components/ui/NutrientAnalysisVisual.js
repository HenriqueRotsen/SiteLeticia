"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import HelpTooltip from "@/components/ui/HelpTooltip";
import {
  ENERGY_DENSITY_BANDS,
  ENERGY_DENSITY_EXPLANATION,
  ENERGY_DENSITY_SCALE_MAX,
  classifyEnergyDensity,
  energyDensityGaugePercent,
  formatDensityValue,
  formatFoodVolume,
  formatVolumeExample,
  getStrategyHint
} from "@/lib/foods/energy-density";
import { formatGrams, formatKcalValue } from "@/lib/foods/nutrition";

function MacroListItem({ color, label, value }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="flex items-center gap-2 text-graphite/75">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-medium text-graphite">{value}</span>
    </li>
  );
}

function MacroCard({ macro }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-olive-900/8 bg-white px-3 py-2.5">
      <span className="h-10 w-1 rounded-full" style={{ backgroundColor: macro.color }} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-graphite">{macro.label}</p>
        <p className="text-xs text-graphite/55">
          {formatGrams(macro.grams)} · {macro.percent}%
        </p>
      </div>
    </div>
  );
}

export function EnergyDensityGauge({
  density,
  kcal = null,
  title = "Densidade calórica",
  strategyHint = null,
  compact = false
}) {
  const classification = classifyEnergyDensity(density);
  const markerPercent = energyDensityGaugePercent(density);
  const volumeExample = kcal ? formatVolumeExample(kcal, density) : null;

  if (density == null) {
    return (
      <div className={compact ? "" : "rounded-xl border border-olive-900/8 bg-linen/30 p-4"}>
        <p className="text-sm font-medium text-graphite">{title}</p>
        <p className="mt-2 text-sm text-graphite/50">Sem peso total para calcular a densidade.</p>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "rounded-xl border border-olive-900/8 bg-linen/30 p-4"}>
      <div className="mb-3 flex items-center gap-2">
        <p className="text-sm font-medium text-graphite">{title}</p>
        <HelpTooltip content={ENERGY_DENSITY_EXPLANATION}>
          <button
            type="button"
            className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-graphite/45"
          >
            ?
          </button>
        </HelpTooltip>
      </div>

      <div className="relative pt-1">
        <div className="flex h-3 overflow-hidden rounded-full">
          {ENERGY_DENSITY_BANDS.map((band) => {
            const width =
              band.max == null
                ? ((ENERGY_DENSITY_SCALE_MAX - band.min) / ENERGY_DENSITY_SCALE_MAX) * 100
                : ((band.max - band.min) / ENERGY_DENSITY_SCALE_MAX) * 100;

            return (
              <div key={band.id} style={{ width: `${width}%`, backgroundColor: band.color }} />
            );
          })}
        </div>

        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
          style={{ left: `${markerPercent}%` }}
        >
          <span className="mt-0.5 block h-5 w-0.5 rounded-full bg-graphite" />
          <span className="mt-1 text-xs font-semibold text-graphite">
            {density.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {classification ? (
        <div className="mt-5 rounded-xl border border-olive-900/8 bg-white px-3 py-3 shadow-sm">
          <p className="text-sm font-medium text-graphite">
            Classificação: <span className="text-green-800">{classification.label}</span>
          </p>
          <p className="mt-1 text-xs leading-5 text-graphite/60">
            {title.includes("refeição") ? "Refeição" : "Plano"} com densidade{" "}
            {classification.label.toLowerCase()} ({classification.rangeLabel})
          </p>
          <p className="mt-2 text-xs text-graphite/55">{formatDensityValue(density)}</p>
          {volumeExample ? (
            <p className="mt-1 text-xs text-graphite/55">Exemplo: {volumeExample}</p>
          ) : null}
        </div>
      ) : null}

      {strategyHint ? (
        <p className="mt-3 text-xs leading-5 text-graphite/60">{strategyHint}</p>
      ) : null}
    </div>
  );
}

export default function NutrientAnalysisVisual({
  analysis,
  densityTitle = "Densidade calórica",
  macrosTitle = "Macronutrientes",
  distributionTitle = "Distribuição calórica (% do VET)",
  strategyHint = null,
  compact = false
}) {
  const macroList = [analysis.macros.protein, analysis.macros.carbs, analysis.macros.fat];

  return (
    <div className={`grid gap-4 ${compact ? "lg:grid-cols-3" : "xl:grid-cols-3"}`}>
      <div className={compact ? "" : "rounded-xl border border-olive-900/8 bg-white p-4"}>
        <p className="mb-2 text-sm font-medium text-graphite">{macrosTitle}</p>
        <ul>
          <MacroListItem
            color={analysis.macros.protein.color}
            label="Proteínas"
            value={formatGrams(analysis.totals.protein_g)}
          />
          <MacroListItem
            color={analysis.macros.fat.color}
            label="Gorduras"
            value={formatGrams(analysis.totals.fat_g)}
          />
          <MacroListItem
            color={analysis.macros.carbs.color}
            label="Carboidratos"
            value={formatGrams(analysis.totals.carbs_g)}
          />
          <MacroListItem color="#64748b" label="Calorias" value={formatKcalValue(analysis.totals.kcal)} />
          <MacroListItem
            color="#252824"
            label="Peso total"
            value={formatFoodVolume(analysis.totalFoodGrams)}
          />
        </ul>
      </div>

      <EnergyDensityGauge
        density={analysis.caloricDensity}
        kcal={analysis.totals.kcal}
        title={densityTitle}
        strategyHint={strategyHint}
        compact={compact}
      />

      <div className={compact ? "" : "rounded-xl border border-olive-900/8 bg-white p-4"}>
        <p className="mb-3 text-sm font-medium text-graphite">{distributionTitle}</p>
        <div className="grid gap-3 sm:grid-cols-[120px,1fr] sm:items-center">
          <div className="mx-auto h-28 w-28">
            {analysis.chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={44}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {analysis.chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} kcal`, "Energia"]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(79, 40, 25, 0.12)",
                      boxShadow: "0 8px 24px rgba(37, 40, 36, 0.08)"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-xs text-graphite/45">—</p>
            )}
          </div>

          <div className="grid gap-2">
            {macroList.map((macro) =>
              macro.kcal > 0 ? <MacroCard key={macro.label} macro={macro} /> : null
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export { MacroCard };
