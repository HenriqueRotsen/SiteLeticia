export const FOOD_SOURCES = {
  TBCA: "tbca",
  TACO: "taco",
  USDA: "usda",
  FATSECRET: "fatsecret",
  OFF: "off",
  CUSTOM: "custom"
};

export const FOOD_SOURCE_LABELS = {
  [FOOD_SOURCES.TBCA]: "TBCA · Brasil",
  [FOOD_SOURCES.TACO]: "TACO · Unicamp",
  [FOOD_SOURCES.USDA]: "USDA · EUA",
  [FOOD_SOURCES.FATSECRET]: "FatSecret",
  [FOOD_SOURCES.OFF]: "Open Food Facts",
  [FOOD_SOURCES.CUSTOM]: "Personalizado"
};

export const DEFAULT_FOOD_SOURCES = [FOOD_SOURCES.TACO];

export function parseFoodSourcesParam(value) {
  if (!value) return [...DEFAULT_FOOD_SOURCES];

  const allowed = new Set(Object.values(FOOD_SOURCES));
  const parsed = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => allowed.has(part));

  return parsed.length ? parsed : [...DEFAULT_FOOD_SOURCES];
}

export function foodSourceLabel(source) {
  return FOOD_SOURCE_LABELS[source] || source;
}

export function usesFatSecretInResults(items) {
  return items.some((item) => item.source === FOOD_SOURCES.FATSECRET);
}
