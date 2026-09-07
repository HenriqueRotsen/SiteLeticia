import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isFatSecretConfigured, searchFatSecret } from "@/lib/foods/fatsecret";
import { FOOD_SOURCES, DEFAULT_FOOD_SOURCES } from "@/lib/foods/sources";
import {
  isTbcaComplementFood,
  isTbcaIngredient,
  normalizeFoodLabel
} from "@/lib/foods/tbca-filter";
import { sanitizePer100g } from "@/lib/foods/nutrition";
import { isUsdaConfigured, searchUsda } from "@/lib/foods/usda";

const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";

function sanitizeSearchToken(token) {
  return token.replace(/[%_\\]/g, "").trim();
}

export function buildFlexibleSearchPattern(query) {
  const tokens = query
    .trim()
    .split(/[\s,]+/)
    .map(sanitizeSearchToken)
    .filter(Boolean);

  if (!tokens.length) return "%";
  if (tokens.length === 1) return `%${tokens[0]}%`;

  return `%${tokens.join("%")}%`;
}

function mapLocalFood(row, source) {
  return {
    source,
    externalId: String(row.id),
    label: row.name,
    per100g: sanitizePer100g(row.per_100g),
    defaultPortionG: 100,
    foodGroup: row.food_group || null,
    code: row.code || null
  };
}

export async function searchTaco(query) {
  const supabase = createSupabaseAdmin();
  const pattern = buildFlexibleSearchPattern(query);
  const { data } = await supabase
    .from("foods_taco")
    .select("id, name, per_100g")
    .ilike("name", pattern)
    .limit(20);

  return (data || []).map((item) => mapLocalFood(item, FOOD_SOURCES.TACO));
}

export async function searchTbca(query) {
  const supabase = createSupabaseAdmin();
  const pattern = buildFlexibleSearchPattern(query);
  const { data } = await supabase
    .from("foods_tbca")
    .select("id, code, name, food_group, per_100g")
    .ilike("name", pattern)
    .limit(20);

  return (data || [])
    .filter((item) => isTbcaComplementFood({ name: item.name, food_group: item.food_group }))
    .map((item) => mapLocalFood(item, FOOD_SOURCES.TBCA));
}

export async function searchOpenFoodFacts(query) {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: "1",
    action: "process",
    json: "1",
    page_size: "15",
    fields: "code,product_name,brands,nutriments,serving_size"
  });

  const response = await fetch(`${OFF_SEARCH}?${params.toString()}`, {
    headers: { "User-Agent": "LeticiaNutricao/1.0 (contact@leticia.local)" },
    next: { revalidate: 3600 }
  });

  if (!response.ok) return [];

  const data = await response.json();
  return (data.products || [])
    .filter((p) => p.product_name)
    .map((p) => ({
      source: FOOD_SOURCES.OFF,
      externalId: p.code,
      label: [p.product_name, p.brands].filter(Boolean).join(" — "),
      per100g: {
        kcal: p.nutriments?.["energy-kcal_100g"],
        protein_g: p.nutriments?.proteins_100g,
        carbs_g: p.nutriments?.carbohydrates_100g,
        fat_g: p.nutriments?.fat_100g,
        fiber_g: p.nutriments?.fiber_100g
      },
      servingSize: p.serving_size
    }));
}

export async function lookupBarcode(barcode) {
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=code,product_name,brands,nutriments,serving_size`,
    {
      headers: { "User-Agent": "LeticiaNutricao/1.0" },
      next: { revalidate: 3600 }
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  if (data.status !== 1) return null;
  const p = data.product;
  return {
    source: FOOD_SOURCES.OFF,
    externalId: p.code,
    label: [p.product_name, p.brands].filter(Boolean).join(" — "),
    per100g: {
      kcal: p.nutriments?.["energy-kcal_100g"],
      protein_g: p.nutriments?.proteins_100g,
      carbs_g: p.nutriments?.carbohydrates_100g,
      fat_g: p.nutriments?.fat_100g
    },
    servingSize: p.serving_size
  };
}

function dedupeResults(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.source}:${item.externalId}:${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupePreferTaco(items) {
  const best = new Map();

  for (const item of items) {
    const key = normalizeFoodLabel(item.label);
    const existing = best.get(key);

    if (!existing) {
      best.set(key, item);
      continue;
    }

    if (existing.source === FOOD_SOURCES.TACO) continue;
    if (item.source === FOOD_SOURCES.TACO) {
      best.set(key, item);
    }
  }

  return [...best.values()];
}

function prioritizeBrSources(items) {
  const order = {
    [FOOD_SOURCES.TACO]: 0,
    [FOOD_SOURCES.TBCA]: 1,
    [FOOD_SOURCES.USDA]: 2,
    [FOOD_SOURCES.FATSECRET]: 3,
    [FOOD_SOURCES.OFF]: 4,
    [FOOD_SOURCES.CUSTOM]: 5
  };

  return [...items].sort((a, b) => (order[a.source] ?? 99) - (order[b.source] ?? 99));
}

async function searchBySources(query, sources) {
  const tasks = [];

  if (sources.includes(FOOD_SOURCES.TBCA)) {
    tasks.push(searchTbca(query).catch((error) => {
      console.error("TBCA search failed:", error);
      return [];
    }));
  }

  if (sources.includes(FOOD_SOURCES.TACO)) {
    tasks.push(searchTaco(query).catch((error) => {
      console.error("TACO search failed:", error);
      return [];
    }));
  }

  if (sources.includes(FOOD_SOURCES.USDA) && isUsdaConfigured()) {
    tasks.push(searchUsda(query).catch((error) => {
      console.error("USDA search failed:", error);
      return [];
    }));
  }

  if (sources.includes(FOOD_SOURCES.FATSECRET) && isFatSecretConfigured()) {
    tasks.push(
      searchFatSecret(query).catch((error) => {
        console.error("FatSecret search failed:", error);
        return [];
      })
    );
  }

  const chunks = await Promise.all(tasks);
  return prioritizeBrSources(dedupePreferTaco(dedupeResults(chunks.flat()))).slice(0, 30);
}

export function getSearchCapabilities(sources = DEFAULT_FOOD_SOURCES) {
  return {
    tbca: sources.includes(FOOD_SOURCES.TBCA),
    taco: sources.includes(FOOD_SOURCES.TACO),
    usda: sources.includes(FOOD_SOURCES.USDA) && isUsdaConfigured(),
    fatsecret: sources.includes(FOOD_SOURCES.FATSECRET) && isFatSecretConfigured(),
    usdaConfigured: isUsdaConfigured(),
    fatsecretConfigured: isFatSecretConfigured()
  };
}

export async function searchFoods(query, options = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const provider = options.provider || "mixed";
  const sources = options.sources?.length ? options.sources : DEFAULT_FOOD_SOURCES;

  if (provider === FOOD_SOURCES.TACO) {
    return searchTaco(trimmed);
  }

  if (provider === FOOD_SOURCES.TBCA) {
    return searchTbca(trimmed);
  }

  if (provider === FOOD_SOURCES.USDA) {
    if (!isUsdaConfigured()) return [];
    return searchUsda(trimmed);
  }

  if (provider === FOOD_SOURCES.FATSECRET) {
    if (!isFatSecretConfigured()) return [];
    return searchFatSecret(trimmed);
  }

  if (provider === "taco") {
    return searchTaco(trimmed);
  }

  if (provider === "mixed") {
    return searchBySources(trimmed, sources);
  }

  if (provider === "br") {
    return searchBySources(trimmed, sources.filter((s) => s === FOOD_SOURCES.TBCA || s === FOOD_SOURCES.TACO));
  }

  if (provider === "all") {
    const allSources = [...new Set([...sources, FOOD_SOURCES.USDA, FOOD_SOURCES.FATSECRET])];
    return searchBySources(trimmed, allSources);
  }

  const [taco, off] = await Promise.all([searchTaco(trimmed), searchOpenFoodFacts(trimmed)]);
  return [...taco, ...off].slice(0, 30);
}
