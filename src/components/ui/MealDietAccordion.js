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
  { key: "protein_g", label: "Prot", unit: "g", color: "bg-rose-500", text: "text-rose-900" },
  { key: "carbs_g", label: "Carbs", unit: "g", color: "bg-sky-500", text: "text-sky-900" },
  { key: "fat_g", label: "Gord", unit: "g", color: "bg-amber-500", text: "text-amber-900" }
];

const ITEM_MACRO_KEYS = ["protein_g", "carbs_g", "fat_g"];

const ITEM_DETAIL_COLUMNS = FATSECRET_REPORT_NUTRIENTS.filter(
  (nutrient) => !["kcal", "protein_g", "carbs_g", "fat_g"].includes(nutrient.key)
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
  if (measureUnit === "unidades") return Number(amount) === 1 ? "un" : "un";
  if (measureUnit === "colher_sopa") return Number(amount) === 1 ? "cs" : "cs";
  if (measureUnit === "colher_sobremesa") return "csb";
  if (measureUnit === "colher_cha") return "cch";
  if (measureUnit === "colher_cafe") return "ccaf";
  return getMeasureUnit(measureUnit).singular || getMeasureUnit(measureUnit).label;
}

function measureTitle(measureUnit, amount) {
  if (measureUnit === "gramas") return "gramas";
  if (measureUnit === "ml") return "mililitros";
  if (measureUnit === "unidades") return Number(amount) === 1 ? "unidade" : "unidades";
  if (measureUnit === "colher_sopa") {
    return Number(amount) === 1 ? "colher de sopa" : "colheres de sopa";
  }
  if (measureUnit === "colher_sobremesa") {
    return Number(amount) === 1 ? "colher de sobremesa" : "colheres de sobremesa";
  }
  if (measureUnit === "colher_cha") return Number(amount) === 1 ? "colher de chá" : "colheres de chá";
  if (measureUnit === "colher_cafe") {
    return Number(amount) === 1 ? "colher de café" : "colheres de café";
  }
  return getMeasureUnit(measureUnit).label;
}

function equivalentWeightLabel(item) {
  if (["gramas", "ml", "litros"].includes(item.measureUnit)) return "";
  if (item.nutritionSnapshot?.portionEstimated) return "";

  const gramsPerUnit = Number(item.gramsPerUnit ?? item.nutritionSnapshot?.gramsPerUnit);
  const amount = Number(item.measureAmount);
  if (!Number.isFinite(gramsPerUnit) || gramsPerUnit <= 0 || !Number.isFinite(amount)) {
    return "";
  }

  const totalGrams = amount * gramsPerUnit;
  return ` · ${formatValue(totalGrams, 1)} g`;
}

function MealSnapshot({ totals, compact = false }) {
  const macroTotal =
    Number(totals?.protein_g || 0) +
    Number(totals?.carbs_g || 0) +
    Number(totals?.fat_g || 0);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="grid grid-cols-4 gap-1.5">
        {PRIMARY_METRICS.map((metric) => (
          <div
            key={metric.key}
            className={`rounded-lg border border-olive-900/8 bg-white/75 ${
              compact ? "px-2 py-1.5" : "px-3 py-2.5"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${metric.color}`} />
              <span className="truncate text-[9px] font-semibold uppercase tracking-wide text-graphite/45">
                {metric.label}
              </span>
            </div>
            <p
              className={`mt-0.5 font-semibold tabular-nums ${metric.text} ${
                compact ? "text-sm" : "text-base"
              }`}
            >
              {formatValue(totals?.[metric.key], metric.key === "kcal" ? 0 : 1)}
              <span className="ml-0.5 text-[9px] font-medium opacity-60">{metric.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {macroTotal > 0 ? (
        <div className="flex h-1 overflow-hidden rounded-full bg-linen" aria-label="Distribuição de macros">
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

      {!compact ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] tabular-nums">
          {ITEM_DETAIL_COLUMNS.filter((nutrient) =>
            ["fiber_g", "sat_fat_g", "sugar_g", "sodium_mg", "potassium_mg"].includes(nutrient.key)
          ).map((nutrient) => (
            <span key={nutrient.key} className="text-graphite/55">
              {nutrient.fullLabel}{" "}
              <strong className="font-semibold text-graphite/80">
                {formatValue(totals?.[nutrient.key], nutrient.decimals)} {nutrient.unit}
              </strong>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FoodItemRow({ meal, item, readOnly, onUpdateItem, onRemoveItem, index }) {
  const itemTotals =
    scaleNutrition(item.per100g, totalPortionGrams(item.quantity, item.portionG)) || {};
  const unit = getMeasureUnit(item.measureUnit);

  return (
    <div
      className={`group border-b border-olive-900/6 px-3 py-2 last:border-0 sm:px-4 ${
        index % 2 === 0 ? "bg-white/80" : "bg-sky-50/20"
      } hover:bg-olive-50/70`}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium leading-snug text-graphite" title={item.label}>
              {item.label}
            </p>
            <span className="shrink-0 rounded-md bg-olive-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-olive-900">
              {formatValue(itemTotals.kcal, 0)}
              <span className="ml-0.5 font-medium opacity-60">kcal</span>
            </span>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1 text-xs text-graphite/55">
              {readOnly ? (
                <span className="tabular-nums" title={measureTitle(item.measureUnit, item.measureAmount)}>
                  {item.measureAmount ?? item.portionG ?? "—"}{" "}
                  {shortMeasureLabel(item.measureUnit, item.measureAmount)}
                  {equivalentWeightLabel(item)}
                </span>
              ) : (
                <>
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
                  <span
                    className="max-w-[7rem] truncate"
                    title={measureTitle(item.measureUnit, item.measureAmount)}
                  >
                    {shortMeasureLabel(item.measureUnit, item.measureAmount)}
                    {equivalentWeightLabel(item)}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] tabular-nums">
              {ITEM_MACRO_KEYS.map((key) => {
                const nutrient = FATSECRET_REPORT_NUTRIENTS.find((entry) => entry.key === key);
                const empty = itemTotals[key] == null;
                return (
                  <span
                    key={key}
                    className={`rounded-md px-1.5 py-0.5 ${
                      empty ? "bg-linen/80 text-graphite/30" : "bg-linen text-graphite/70"
                    }`}
                    title={nutrient?.fullLabel}
                  >
                    <span className="font-medium text-graphite/40">{nutrient?.label}</span>{" "}
                    <strong className="font-semibold">{formatValue(itemTotals[key], nutrient?.decimals)}</strong>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5 text-[10px] tabular-nums text-graphite/45">
            {ITEM_DETAIL_COLUMNS.map((nutrient) => (
              <span key={nutrient.key} title={`${nutrient.fullLabel} (${nutrient.unit})`}>
                {nutrient.label}{" "}
                <span
                  className={
                    itemTotals[nutrient.key] == null ? "text-graphite/25" : "font-medium text-graphite/65"
                  }
                >
                  {formatValue(itemTotals[nutrient.key], nutrient.decimals)}
                </span>
              </span>
            ))}
          </div>
        </div>

        {readOnly ? null : (
          <button
            type="button"
            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-red-500 opacity-35 transition hover:bg-red-50 hover:text-red-700 hover:opacity-100 group-hover:opacity-100"
            onClick={() => onRemoveItem?.(meal.clientId, item.clientId)}
            aria-label={`Remover ${item.label}`}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Refeição colapsável: resumo no cabeçalho e lista compacta de alimentos.
 */
export default function MealDietAccordion({
  meal,
  defaultOpen = false,
  readOnly = false,
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
        open ? "border-olive-400/60 shadow-md ring-1 ring-olive-200/50" : "hover:border-olive-300"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition sm:px-5 ${
          open ? "bg-gradient-to-r from-olive-50/90 to-porcelain" : "hover:bg-linen/35"
        }`}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-graphite sm:text-base">{meal.name}</h2>
              <p className="mt-0.5 text-[11px] text-graphite/50">
                {itemCount} {itemCount === 1 ? "alimento" : "alimentos"}
                {" · "}
                {open ? "detalhes" : "abrir"}
              </p>
            </div>
            <span className="rounded-full bg-olive-100 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-olive-900">
              {formatKcalValue(mealTotals.kcal)}
            </span>
          </div>
          <MealSnapshot totals={mealTotals} compact={!open} />
        </div>
        <span
          className={`mt-0.5 rounded-full p-1.5 transition ${
            open ? "bg-olive-700 text-white" : "bg-linen text-graphite/55"
          }`}
        >
          <ChevronDown
            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </span>
      </button>

      {open ? (
        <div className="border-t border-olive-900/10 bg-white/45">
          <div className="divide-y-0">
            {(meal.items || []).map((item, index) => (
              <FoodItemRow
                key={item.clientId}
                meal={meal}
                item={item}
                index={index}
                readOnly={readOnly}
                onUpdateItem={onUpdateItem}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-olive-900/10 bg-olive-50/60 px-4 py-2.5 sm:px-5">
            <span className="text-[11px] font-medium text-graphite/60">Total da refeição</span>
            <span className="text-sm font-semibold tabular-nums text-olive-900">
              {formatKcalValue(mealTotals.kcal)}
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
