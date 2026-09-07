"use client";

import { FOOD_SOURCES } from "@/lib/foods/sources";

const SOURCE_OPTIONS = [
  {
    id: FOOD_SOURCES.TACO,
    label: "TACO",
    hint: "Ingredientes Unicamp (recomendado)"
  },
  {
    id: FOOD_SOURCES.TBCA,
    label: "TBCA",
    hint: "Complemento USP (opcional)"
  },
  {
    id: FOOD_SOURCES.USDA,
    label: "USDA",
    hint: "API EUA (usa cota)"
  },
  {
    id: FOOD_SOURCES.FATSECRET,
    label: "FatSecret",
    hint: "Industrializados (usa cota)"
  }
];

function SourceToggle({ option, enabled, onChange, disabled }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 ${
        enabled
          ? "border-olive-600/25 bg-white shadow-sm"
          : "border-white/50 bg-white/50 opacity-80"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={`Buscar em ${option.label}`}
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          enabled ? "bg-olive-600" : "bg-graphite/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="min-w-0 text-sm text-graphite">
        <span className="font-medium">{option.label}</span>
        <span className="mt-0.5 block text-xs text-graphite/55">{option.hint}</span>
      </span>
    </label>
  );
}

export default function FoodSourceToggles({ enabledSources, onChange, capabilities = {}, className = "" }) {
  function toggleSource(sourceId) {
    const next = enabledSources.includes(sourceId)
      ? enabledSources.filter((id) => id !== sourceId)
      : [...enabledSources, sourceId];

    if (!next.length) return;
    onChange(next);
  }

  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className}`}>
      {SOURCE_OPTIONS.map((option) => {
        const disabled =
          (option.id === FOOD_SOURCES.USDA && capabilities.usdaConfigured === false) ||
          (option.id === FOOD_SOURCES.FATSECRET && capabilities.fatsecretConfigured === false);

        return (
          <SourceToggle
            key={option.id}
            option={option}
            enabled={enabledSources.includes(option.id)}
            disabled={disabled}
            onChange={() => toggleSource(option.id)}
          />
        );
      })}
    </div>
  );
}

export function buildSearchPlaceholder(enabledSources) {
  const labels = enabledSources
    .map((source) => SOURCE_OPTIONS.find((option) => option.id === source)?.label)
    .filter(Boolean);

  return labels.length ? labels.join(" + ") : "Selecione uma fonte";
}
