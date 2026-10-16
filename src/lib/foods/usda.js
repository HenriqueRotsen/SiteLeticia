const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

const NUTRIENT_MAP = {
  1008: "kcal",
  2047: "kcal",
  2048: "kcal",
  1003: "protein_g",
  1004: "fat_g",
  1005: "carbs_g",
  1079: "fiber_g",
  1093: "sodium_mg",
  1087: "calcium_mg",
  1089: "iron_mg",
  1092: "potassium_mg",
  1090: "magnesium_mg",
  1091: "phosphorus_mg",
  1095: "zinc_mg",
  1106: "vitamin_a_mcg",
  1162: "vitamin_c_mg",
  1114: "vitamin_d_mcg",
  1178: "vitamin_b12_mcg",
  1177: "folate_mcg"
};

function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

export function isUsdaConfigured() {
  return Boolean(process.env.USDA_API_KEY?.trim());
}

function getApiKey() {
  return process.env.USDA_API_KEY?.trim() || "DEMO_KEY";
}

function nutrientsFromFoodNutrients(foodNutrients = []) {
  const per100g = {};

  for (const entry of foodNutrients) {
    const key = NUTRIENT_MAP[entry.nutrientId ?? entry.nutrient?.id];
    if (!key || entry.value == null) continue;

    if (key === "kcal" && per100g.kcal != null) continue;

    per100g[key] = round(entry.value);
  }

  return Object.keys(per100g).length ? per100g : null;
}

export function mapUsdaFood(food) {
  const per100g = nutrientsFromFoodNutrients(food.foodNutrients);
  const description = food.description || food.lowercaseDescription || "Alimento USDA";

  return {
    source: "usda",
    externalId: String(food.fdcId),
    label: description,
    per100g,
    defaultPortionG: 100,
    dataType: food.dataType || null,
    brandOwner: food.brandOwner || null
  };
}

async function fdcRequest(path, params = {}) {
  const url = new URL(`${FDC_BASE}${path}`);
  url.searchParams.set("api_key", getApiKey());

  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, item);
    } else {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 86400 }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`USDA API error (${response.status}): ${text}`);
  }

  return response.json();
}

export async function searchUsda(query) {
  if (!query?.trim()) return [];

  const data = await fdcRequest("/foods/search", {
    query: query.trim(),
    pageSize: 15,
    dataType: ["Foundation", "SR Legacy", "Survey (FNDDS)"]
  });

  return (data.foods || [])
    .map(mapUsdaFood)
    .filter((food) => food.label);
}

export async function getUsdaFood(fdcId) {
  const data = await fdcRequest(`/food/${encodeURIComponent(fdcId)}`, {
    format: "abridged",
    nutrients: Object.keys(NUTRIENT_MAP).join(",")
  });

  if (!data?.fdcId) return null;
  return mapUsdaFood(data);
}
