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
  formatVolumeExample
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
  compact = false
}) {
  const classification = classifyEnergyDensity(density);
  const markerPercent = energyDensityGaugePercent(density);
  const volumeExample = kcal ? formatVolumeExample(kcal, density) : null;

  if (density == null) {
    return (
      <div className="rounded-2xl border border-olive-900/8 bg-linen/30 p-4">
        <p className="text-sm font-medium text-graphite">{title}</p>
        <p className="mt-2 text-sm text-graphite/50">Sem peso total para calcular a densidade.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-olive-900/8 bg-gradient-to-br from-white via-linen/35 to-olive-50/60 p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-graphite">{title}</p>
          <p className="mt-0.5 text-xs text-graphite/45">Calorias por grama de alimento</p>
        </div>
        <HelpTooltip content={ENERGY_DENSITY_EXPLANATION}>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-full border border-olive-900/8 bg-white text-[10px] font-semibold text-graphite/45"
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
        <div className="mt-6 flex items-start justify-between gap-3 rounded-xl border border-olive-900/8 bg-white/85 px-3 py-3">
          <div>
            <span className="inline-flex rounded-full bg-olive-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-olive-900">
              {classification.label}
            </span>
            <p className="mt-2 text-xs text-graphite/55">{classification.rangeLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold tabular-nums text-graphite">{formatDensityValue(density)}</p>
            {volumeExample ? (
              <p className="mt-1 max-w-[180px] text-[10px] leading-4 text-graphite/45">{volumeExample}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function NutrientAnalysisVisual({
  analysis,
  densityTitle = "Densidade calórica",
  macrosTitle = "Macronutrientes",
  distributionTitle = "Distribuição calórica (% do VET)",
  compact = false
}) {
  const macroList = [analysis.macros.protein, analysis.macros.carbs, analysis.macros.fat];

  if (compact) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <EnergyDensityGauge
          density={analysis.caloricDensity}
          kcal={analysis.totals.kcal}
          title={densityTitle}
          compact
        />

        <div className="relative overflow-hidden rounded-2xl border border-olive-900/8 bg-gradient-to-br from-white via-linen/40 to-olive-50/50 p-4">
          <p className="mb-4 text-sm font-semibold text-graphite">{distributionTitle}</p>
          <div className="grid grid-cols-[112px,1fr] items-center gap-4">
            <div className="relative mx-auto h-28 w-28">
              {analysis.chartData.length ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analysis.chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={48}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {analysis.chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-wide text-graphite/45">VET</p>
                      <p className="text-sm font-semibold tabular-nums text-graphite">
                        {formatKcalValue(analysis.totals.kcal).replace(" kcal", "")}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="flex h-full items-center justify-center text-xs text-graphite/45">—</p>
              )}
            </div>
            <ul className="space-y-2.5">
              {macroList.map((macro) => (
                <li key={macro.label} className="rounded-xl border border-olive-900/6 bg-white/80 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-graphite">
                      <span
                        className="h-2.5 w-2.5 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: macro.color }}
                      />
                      {macro.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-graphite">
                      {macro.percent}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-linen">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(macro.percent, 100)}%`, backgroundColor: macro.color }}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] tabular-nums text-graphite/55">
                    {formatGrams(macro.grams)} · {macro.kcal} kcal
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <div className="rounded-xl border border-olive-900/8 bg-white p-4">
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
        compact={compact}
      />

      <div className="rounded-xl border border-olive-900/8 bg-white p-4">
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
