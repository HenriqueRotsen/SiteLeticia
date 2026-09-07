"use client";

import { FATSECRET_REPORT_NUTRIENTS, formatNutrientValue } from "@/lib/foods/nutrition";

const TONE_CLASSES = {
  energy: "border-olive-200 bg-olive-50 text-olive-950",
  protein: "border-rose-200 bg-rose-50 text-rose-950",
  carb: "border-sky-200 bg-sky-50 text-sky-950",
  fat: "border-amber-200 bg-amber-50 text-amber-950",
  micro: "border-violet-200 bg-violet-50/70 text-violet-950"
};

const GROUPS = [
  { title: "Energia", keys: ["kcal"], className: "border-olive-200 bg-olive-50" },
  {
    title: "Macronutrientes",
    keys: ["protein_g", "carbs_g", "fat_g"],
    className: "border-slate-200 bg-white"
  },
  {
    title: "Qualidade nutricional",
    keys: ["fiber_g", "sat_fat_g", "sugar_g"],
    className: "border-sky-200 bg-sky-50/45"
  },
  {
    title: "Minerais e colesterol",
    keys: ["sodium_mg", "potassium_mg", "cholesterol_mg"],
    className: "border-violet-200 bg-violet-50/45"
  }
];

function NutrientValue({ nutrient, value, compact = false }) {
  const empty = value == null || value === "";

  return (
    <div className={`min-w-0 ${empty ? "opacity-45" : ""}`}>
      <p className={`truncate font-medium text-current/55 ${compact ? "text-[9px]" : "text-[10px]"}`}>
        {nutrient.fullLabel}
      </p>
      <p className={`mt-0.5 font-semibold tabular-nums ${compact ? "text-xs" : "text-base"}`}>
        {empty
          ? "—"
          : formatNutrientValue(nutrient.key, value).replace(` ${nutrient.unit}`, "")}
        <span className="ml-1 text-[9px] font-medium opacity-50">{nutrient.unit}</span>
      </p>
    </div>
  );
}

export default function FatSecretNutrientGrid({
  totals,
  title = "Nutrientes FatSecret",
  compact = false,
  /** micro = faixa compacta por alimento */
  size = "default"
}) {
  const isMicro = size === "micro";
  const isCompact = compact || isMicro;

  if (!isCompact) {
    return (
      <div className="space-y-3">
        {title ? <p className="text-sm font-semibold text-graphite">{title}</p> : null}
        <div className="grid gap-2 sm:grid-cols-2">
          {GROUPS.map((group) => (
            <section key={group.title} className={`rounded-2xl border p-3.5 ${group.className}`}>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite/45">
                {group.title}
              </p>
              <div className={`grid gap-3 ${group.keys.length === 1 ? "grid-cols-1" : "grid-cols-3"}`}>
                {group.keys.map((key) => {
                  const nutrient = FATSECRET_REPORT_NUTRIENTS.find((entry) => entry.key === key);
                  return (
                    <NutrientValue
                      key={key}
                      nutrient={nutrient}
                      value={totals?.[key]}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={isMicro ? "space-y-0" : isCompact ? "space-y-2" : "space-y-3"}>
      {title ? (
        <p
          className={`font-semibold text-graphite ${
            isMicro ? "text-[11px]" : isCompact ? "text-xs" : "text-sm"
          }`}
        >
          {title}
        </p>
      ) : null}
      <div
        className={`grid ${
          isMicro
            ? "grid-cols-5 gap-1 sm:grid-cols-10"
            : isCompact
              ? "grid-cols-5 gap-1.5 sm:grid-cols-10"
              : "grid-cols-2 gap-2 sm:grid-cols-5"
        }`}
      >
        {FATSECRET_REPORT_NUTRIENTS.map((nutrient) => {
          const value = totals?.[nutrient.key];
          const empty = value == null || value === "";
          const tone = TONE_CLASSES[nutrient.tone] || TONE_CLASSES.micro;

          return (
            <div
              key={nutrient.key}
              title={`${nutrient.fullLabel}: ${empty ? "vazio" : formatNutrientValue(nutrient.key, value)}`}
              className={`flex flex-col items-center justify-center border text-center transition hover:-translate-y-0.5 hover:shadow-sm ${tone} ${
                empty ? "opacity-50" : ""
              } ${
                isMicro
                  ? "min-h-[44px] rounded-lg px-1 py-1"
                  : "min-h-[64px] rounded-2xl px-2.5 py-2.5"
              }`}
            >
              <p
                className={`leading-none font-semibold uppercase tracking-wide ${
                  isMicro ? "text-[9px]" : isCompact ? "text-[10px]" : "text-xs"
                }`}
              >
                {nutrient.label}
              </p>
              <p
                className={`mt-1 leading-none font-semibold tabular-nums ${
                  isMicro ? "text-xs" : isCompact ? "text-sm" : "text-base"
                }`}
              >
                {empty ? "—" : formatNutrientValue(nutrient.key, value).replace(` ${nutrient.unit}`, "")}
              </p>
              {!isMicro ? (
                <p className={`mt-1 leading-none opacity-70 ${isCompact ? "text-[10px]" : "text-[11px]"}`}>
                  {nutrient.unit}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
