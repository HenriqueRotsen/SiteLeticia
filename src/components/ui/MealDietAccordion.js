"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { Card, inputClassName } from "@/components/layout/AppShell";
import {
  FATSECRET_REPORT_NUTRIENTS,
  scaleNutrition,
  sumNutrition,
  totalPortionGrams,
  formatKcalValue
} from "@/lib/foods/nutrition";
import { getMeasureUnit } from "@/lib/foods/measures";

const PRIMARY_METRICS = [
  { key: "kcal", label: "Energia", unit: "kcal", color: "bg-olive-700", text: "text-olive-900" },
  { key: "protein_g", label: "Proteína", unit: "g", color: "bg-rose-500", text: "text-rose-900" },
  { key: "carbs_g", label: "Carboidratos", unit: "g", color: "bg-sky-500", text: "text-sky-900" },
  { key: "fat_g", label: "Gorduras", unit: "g", color: "bg-amber-500", text: "text-amber-900" }
];

const DETAIL_COLUMNS = FATSECRET_REPORT_NUTRIENTS.filter(
  (nutrient) => nutrient.key !== "kcal"
);

function formatValue(value, decimals = 1) {
  if (value == null || value === "") return "—";
  return Number(value).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

function shortMeasureLabel(measureUnit, amount) {
  if (measureUnit === "gramas") return "g";
  if (measureUnit === "ml") return "ml";
  if (measureUnit === "unidades") return Number(amount) === 1 ? "unidade" : "unidades";
  if (measureUnit === "colher_sopa") return Number(amount) === 1 ? "colher de sopa" : "colheres de sopa";
  if (measureUnit === "colher_sobremesa") {
    return Number(amount) === 1 ? "colher de sobremesa" : "colheres de sobremesa";
  }
  if (measureUnit === "colher_cha") return Number(amount) === 1 ? "colher de chá" : "colheres de chá";
  if (measureUnit === "colher_cafe") return Number(amount) === 1 ? "colher de café" : "colheres de café";
  return getMeasureUnit(measureUnit).label;
}

function equivalentWeightLabel(item) {
  if (["gramas", "ml", "litros"].includes(item.measureUnit)) return "";
  if (item.nutritionSnapshot?.portionEstimated) return "";

  const gramsPerUnit = Number(
    item.gramsPerUnit ?? item.nutritionSnapshot?.gramsPerUnit
  );
  const amount = Number(item.measureAmount);
  if (!Number.isFinite(gramsPerUnit) || gramsPerUnit <= 0 || !Number.isFinite(amount)) {
    return "";
  }

  const totalGrams = amount * gramsPerUnit;
  return `, ${formatValue(totalGrams, 1)} g`;
}

function MealSnapshot({ totals }) {
  const macroTotal =
    Number(totals?.protein_g || 0) +
    Number(totals?.carbs_g || 0) +
    Number(totals?.fat_g || 0);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {PRIMARY_METRICS.map((metric) => (
          <div key={metric.key} className="rounded-xl border border-olive-900/8 bg-white/75 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${metric.color}`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-graphite/45">
                {metric.label}
              </span>
            </div>
            <p className={`mt-1 text-base font-semibold tabular-nums ${metric.text}`}>
              {formatValue(totals?.[metric.key], metric.key === "kcal" ? 0 : 1)}
              <span className="ml-1 text-[10px] font-medium opacity-60">{metric.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {macroTotal > 0 ? (
        <div className="flex h-1.5 overflow-hidden rounded-full bg-linen" aria-label="Distribuição de macros">
          <span
            className="bg-rose-500"
            style={{ width: `${(Number(totals.protein_g || 0) / macroTotal) * 100}%` }}
          />
          <span
            className="bg-sky-500"
            style={{ width: `${(Number(totals.carbs_g || 0) / macroTotal) * 100}%` }}
          />
          <span
            className="bg-amber-500"
            style={{ width: `${(Number(totals.fat_g || 0) / macroTotal) * 100}%` }}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] tabular-nums">
        {DETAIL_COLUMNS.filter((nutrient) =>
          ["fiber_g", "sat_fat_g", "sugar_g", "sodium_mg", "potassium_mg"].includes(
            nutrient.key
          )
        ).map((nutrient) => (
          <span key={nutrient.key} className="text-graphite/55">
            {nutrient.fullLabel}{" "}
            <strong className="font-semibold text-graphite/80">
              {formatValue(totals?.[nutrient.key], nutrient.decimals)} {nutrient.unit}
            </strong>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Refeição colapsável: resumo comparável no cabeçalho e tabela nutricional no detalhe.
 */
export default function MealDietAccordion({
  meal,
  defaultOpen = false,
  onUpdateItem,
  onRemoveItem
}) {
  const [open, setOpen] = useState(defaultOpen);

  const analysisItems = useMemo(
    () =>
      (meal.items || []).map((item) => ({
        per100g: item.per100g,
        quantity: item.quantity,
        portionG: item.portionG
      })),
    [meal.items]
  );

  const mealTotals = useMemo(() => sumNutrition(analysisItems), [analysisItems]);
  const itemCount = meal.items?.length || 0;

  return (
    <Card
      className={`overflow-hidden p-0 transition sm:p-0 ${
        open ? "border-olive-400/60 shadow-lg ring-1 ring-olive-200/60" : "hover:border-olive-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-start gap-4 px-5 py-4 text-left transition sm:px-6 ${
          open ? "bg-gradient-to-r from-olive-50/90 to-porcelain" : "hover:bg-linen/35"
        }`}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-graphite">{meal.name}</h2>
              <p className="mt-0.5 text-xs text-graphite/50">
                {itemCount} {itemCount === 1 ? "alimento" : "alimentos"}
                {" · "}
                {open ? "detalhes visíveis" : "clique para analisar"}
              </p>
            </div>
            <span className="rounded-full bg-olive-100 px-3 py-1 text-xs font-semibold tabular-nums text-olive-900">
              {formatKcalValue(mealTotals.kcal)}
            </span>
          </div>
          <MealSnapshot totals={mealTotals} />
        </div>
        <span className={`mt-1 rounded-full p-2 transition ${open ? "bg-olive-700 text-white" : "bg-linen text-graphite/55"}`}>
          <ChevronDown
            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </span>
      </button>

      {open ? (
        <div className="border-t border-olive-900/10 bg-white/45">
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              <div className="grid grid-cols-[minmax(300px,1fr)_60px_repeat(9,58px)_40px] items-center gap-1 border-b border-olive-900/10 bg-linen/65 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-graphite/45">
                <span>Alimento</span>
                <span className="text-right">Kcal</span>
                {DETAIL_COLUMNS.map((nutrient) => (
                  <span key={nutrient.key} className="text-right" title={nutrient.fullLabel}>
                    {nutrient.label}
                  </span>
                ))}
                <span />
              </div>

              {(meal.items || []).map((item, index) => {
              const itemTotals =
                scaleNutrition(item.per100g, totalPortionGrams(item.quantity, item.portionG)) || {};

              return (
                <div
                  key={item.clientId}
                  className={`group grid grid-cols-[minmax(300px,1fr)_60px_repeat(9,58px)_40px] items-center gap-1 border-b border-olive-900/6 px-4 py-2.5 transition last:border-0 ${
                    index % 2 === 0 ? "bg-white/80" : "bg-sky-50/25"
                  } hover:relative hover:z-[1] hover:bg-olive-50 hover:shadow-[inset_3px_0_0_#5f6f3b]`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-sm font-medium text-graphite" title={item.label}>
                      {item.label}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-graphite/55">
                      {(() => {
                      const unit = getMeasureUnit(item.measureUnit);
                      return (
                        <input
                          type="number"
                          min={unit.min}
                          step={unit.step}
                          className={`${inputClassName()} !h-7 !w-14 !rounded-md !px-1.5 !py-0 text-right text-xs tabular-nums`}
                          value={item.measureAmount ?? item.portionG ?? ""}
                          onChange={(event) =>
                            onUpdateItem?.(meal.clientId, item.clientId, {
                              measureAmount: Number(event.target.value) || unit.min,
                              measureUnit: item.measureUnit || "gramas"
                            })
                          }
                          aria-label={`Quantidade de ${item.label}`}
                        />
                      );
                      })()}
                      <span
                        className="truncate"
                        title={`Unidade importada do CSV: ${shortMeasureLabel(
                          item.measureUnit,
                          item.measureAmount
                        )}`}
                      >
                        {shortMeasureLabel(item.measureUnit, item.measureAmount)}
                        {equivalentWeightLabel(item)}
                      </span>
                    </div>
                  </div>
                  <span className="text-right text-xs font-semibold tabular-nums text-olive-900">
                    {formatValue(itemTotals.kcal, 0)}
                  </span>
                  {DETAIL_COLUMNS.map((nutrient) => (
                    <span
                      key={nutrient.key}
                      className={`text-right text-xs tabular-nums ${
                        itemTotals[nutrient.key] == null ? "text-graphite/25" : "text-graphite/70"
                      }`}
                      title={`${nutrient.fullLabel} (${nutrient.unit})`}
                    >
                      {formatValue(itemTotals[nutrient.key], nutrient.decimals)}
                    </span>
                  ))}
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-500 opacity-40 transition hover:bg-red-50 hover:text-red-700 hover:opacity-100 group-hover:opacity-100"
                    onClick={() => onRemoveItem?.(meal.clientId, item.clientId)}
                    aria-label={`Remover ${item.label}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              );
            })}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-olive-900/10 bg-olive-50/60 px-5 py-3">
            <span className="text-xs font-medium text-graphite/60">Total da refeição</span>
            <span className="text-sm font-semibold tabular-nums text-olive-900">
              {formatKcalValue(mealTotals.kcal)}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
