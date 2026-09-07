const TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const API_URL = "https://platform.fatsecret.com/rest/server.api";

let tokenCache = { token: null, expiresAt: 0 };

function parseNum(value) {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function isFatSecretConfigured() {
  return Boolean(process.env.FATSECRET_CLIENT_ID && process.env.FATSECRET_CLIENT_SECRET);
}

export function isFatSecretLocalizationEnabled() {
  return process.env.FATSECRET_LOCALIZATION === "true";
}

function appendLocalizationParams(params) {
  if (!isFatSecretLocalizationEnabled()) {
    return params;
  }

  const region = process.env.FATSECRET_REGION?.trim();
  if (!region) {
    return params;
  }

  params.region = region;

  const language = process.env.FATSECRET_LANGUAGE?.trim();
  if (language) {
    params.language = language;
  }

  return params;
}

async function getAccessToken() {
  if (!isFatSecretConfigured()) return null;

  if (tokenCache.token && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const clientId = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;
  const scope = process.env.FATSECRET_SCOPE || "basic";
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FatSecret token error (${response.status}): ${text}`);
  }

  const data = await response.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000
  };

  return tokenCache.token;
}

async function fatSecretRequest(params) {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ ...params, format: "json" })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`FatSecret API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || "FatSecret API error");
  }

  return data;
}

export function nutritionFromServing(serving, targetGrams = 100) {
  if (!serving) return null;

  const amount = parseNum(serving.metric_serving_amount);
  const unit = serving.metric_serving_unit;

  if (amount > 0 && unit === "g") {
    const factor = targetGrams / amount;
    const nutrition = {
      kcal: round(parseNum(serving.calories) * factor),
      protein_g: round(parseNum(serving.protein) * factor),
      carbs_g: round(parseNum(serving.carbohydrate) * factor),
      fat_g: round(parseNum(serving.fat) * factor),
      fiber_g: serving.fiber ? round(parseNum(serving.fiber) * factor) : undefined
    };
    appendMicronutrients(nutrition, serving, factor);
    return nutrition;
  }

  const nutrition = {
    kcal: round(parseNum(serving.calories)),
    protein_g: round(parseNum(serving.protein)),
    carbs_g: round(parseNum(serving.carbohydrate)),
    fat_g: round(parseNum(serving.fat)),
    fiber_g: serving.fiber ? round(parseNum(serving.fiber)) : undefined
  };
  appendMicronutrients(nutrition, serving, 1);
  return nutrition;
}

const MICRO_SERVING_MAP = {
  sodium_mg: "sodium",
  potassium_mg: "potassium",
  calcium_mg: "calcium",
  magnesium_mg: "magnesium",
  phosphorus_mg: "phosphorus",
  iron_mg: "iron",
  zinc_mg: "zinc",
  vitamin_c_mg: "vitamin_c",
  vitamin_a_iu: "vitamin_a",
  vitamin_d_mcg: "vitamin_d",
  vitamin_b12_mcg: "vitamin_b12",
  folate_mcg: "folate"
};

function appendMicronutrients(target, serving, factor) {
  for (const [key, field] of Object.entries(MICRO_SERVING_MAP)) {
    if (serving[field] == null || serving[field] === "") continue;
    target[key] = round(parseNum(serving[field]) * factor);
  }
}

function pickDefaultServing(servings) {
  const list = asArray(servings);
  if (!list.length) return null;

  const per100 = list.find(
    (s) => s.metric_serving_unit === "g" && Math.abs(parseNum(s.metric_serving_amount) - 100) < 0.01
  );
  if (per100) return per100;

  const flagged = list.find((s) => s.is_default === "1" || s.is_default === 1);
  return flagged || list[0];
}

export function parseFoodDescription(description) {
  if (!description) return null;

  const perMatch = description.match(/Per\s+([\d.]+)\s*(g|ml)\b/i);
  const gramAmount = perMatch ? parseNum(perMatch[1]) : 100;
  const unit = perMatch?.[2]?.toLowerCase() === "ml" ? "ml" : "g";

  const calories = description.match(/Calories:\s*([\d.]+)\s*kcal/i)?.[1];
  if (!calories) return null;

  const serving = {
    calories,
    protein: description.match(/Protein:\s*([\d.]+)\s*g/i)?.[1],
    fat: description.match(/Fat:\s*([\d.]+)\s*g/i)?.[1],
    carbohydrate: description.match(/Carbs:\s*([\d.]+)\s*g/i)?.[1],
    fiber: description.match(/Fiber:\s*([\d.]+)\s*g/i)?.[1],
    metric_serving_amount: gramAmount,
    metric_serving_unit: unit
  };

  if (unit !== "g" || gramAmount <= 0) {
    return {
      per100g: nutritionFromServing(serving, 100),
      defaultPortionG: 100
    };
  }

  return {
    per100g: nutritionFromServing(serving, 100),
    defaultPortionG: gramAmount
  };
}

export function mapFatSecretFood(food) {
  const servings = food.servings?.serving;
  const defaultServing = pickDefaultServing(servings);
  let per100g = defaultServing ? nutritionFromServing(defaultServing, 100) : null;
  let defaultPortionG =
    defaultServing?.metric_serving_unit === "g"
      ? parseNum(defaultServing.metric_serving_amount) || 100
      : 100;

  if (!per100g && food.food_description) {
    const parsed = parseFoodDescription(food.food_description);
    if (parsed) {
      per100g = parsed.per100g;
      defaultPortionG = parsed.defaultPortionG;
    }
  }

  const label = food.brand_name
    ? `${food.food_name} — ${food.brand_name}`
    : food.food_name;

  return {
    source: "fatsecret",
    externalId: String(food.food_id),
    label,
    foodType: food.food_type,
    per100g,
    defaultPortionG,
    servingDescription: defaultServing?.serving_description || food.food_description || null
  };
}

function extractSearchResults(data) {
  return (
    data.foods_search?.results?.food ??
    data.foods?.food ??
    data.foods_search?.food ??
    null
  );
}

export async function searchFatSecret(query) {
  const params = appendLocalizationParams({
    method: "foods.search",
    search_expression: query,
    max_results: "20",
    flag_default_serving: "true"
  });

  const data = await fatSecretRequest(params);
  if (!data) return [];

  const foods = extractSearchResults(data);
  return asArray(foods).map(mapFatSecretFood);
}

export async function getFatSecretFood(foodId) {
  const params = appendLocalizationParams({
    method: "food.get.v2",
    food_id: String(foodId)
  });

  const data = await fatSecretRequest(params);
  if (!data?.food) return null;
  return mapFatSecretFood(data.food);
}

export function planUsesFatSecret(plan) {
  if (!plan?.diet_meals) return false;
  return plan.diet_meals.some((meal) =>
    (meal.diet_items || []).some((item) => item.source === "fatsecret")
  );
}
