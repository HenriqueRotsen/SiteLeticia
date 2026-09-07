import {
  FATSECRET_REPORT_KEYS,
  FATSECRET_REPORT_NUTRIENTS,
  sanitizePer100g
} from "@/lib/foods/nutrition";
import { buildNutritionSnapshot, getMeasureUnit, toStoredPortion } from "@/lib/foods/measures";

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parseFatSecretNumber(value) {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Parser CSV simples que respeita aspas (necessário para linhas de porção).
 */
export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

export function portionNutritionToPer100g(portionNutrition, portionG) {
  const grams = Number(portionG);
  const factor = Number.isFinite(grams) && grams > 0 ? 100 / grams : null;
  const per100g = {};

  for (const nutrient of FATSECRET_REPORT_NUTRIENTS) {
    const value = portionNutrition?.[nutrient.key];
    if (value == null || value === "" || !Number.isFinite(Number(value)) || factor == null) {
      per100g[nutrient.key] = null;
      continue;
    }
    per100g[nutrient.key] = round(Number(value) * factor, nutrient.decimals ?? 1);
  }

  return sanitizePer100g(per100g);
}

export function parsePortionLabel(rawLabel) {
  const label = decodeHtmlEntities(String(rawLabel || "").trim().replace(/^"+|"+$/g, ""));
  if (!label) {
    return {
      portionG: 100,
      amountLabel: "100 g",
      measureUnit: "gramas",
      measureAmount: 100
    };
  }

  const amountMatch = label.match(/^(\d+[.,]?\d*)\b/);
  const count = parseFatSecretNumber(amountMatch?.[1]) || 1;
  const gramsMatch = label.match(/(\d+[.,]?\d*)\s*g\b/i);
  const mlMatch = label.match(/(\d+[.,]?\d*)\s*ml\b/i);
  const totalGrams = parseFatSecretNumber(gramsMatch?.[1]);
  const totalMl = parseFatSecretNumber(mlMatch?.[1]);

  if (totalMl != null) {
    return {
      portionG: totalMl,
      amountLabel: label,
      measureUnit: "ml",
      measureAmount: totalMl
    };
  }

  const spoonUnit = /colher(?:es)?\s+de\s+sopa/i.test(label)
    ? "colher_sopa"
    : /colher(?:es)?\s+de\s+sobremesa/i.test(label)
      ? "colher_sobremesa"
      : /colher(?:es)?\s+de\s+ch[aá]/i.test(label)
        ? "colher_cha"
        : /colher(?:es)?\s+de\s+caf[eé]/i.test(label)
          ? "colher_cafe"
          : null;

  if (spoonUnit) {
    const defaultWeight = getMeasureUnit(spoonUnit).gramsPerUnit;
    const portionG = totalGrams || count * defaultWeight;
    return {
      portionG,
      amountLabel: label,
      measureUnit: spoonUnit,
      measureAmount: count,
      gramsPerUnit: portionG / count,
      estimated: totalGrams == null
    };
  }

  const isCountable =
    /(?:fatia|unidade|porção|porcao|copo|pequeno|pequena|médio|medio|média|media|grande)s?/i.test(
      label
    );

  if (isCountable) {
    const portionG = totalGrams || 100;
    return {
      portionG,
      amountLabel: label,
      measureUnit: "unidades",
      measureAmount: count,
      gramsPerUnit: portionG / count,
      estimated: totalGrams == null
    };
  }

  if (totalGrams != null) {
    return {
      portionG: totalGrams,
      amountLabel: label,
      measureUnit: "gramas",
      measureAmount: totalGrams
    };
  }

  return {
    portionG: 100,
    amountLabel: label,
    measureUnit: "unidades",
    measureAmount: count,
    gramsPerUnit: 100 / count,
    estimated: true
  };
}

function leadingSpaceCount(line) {
  // FatSecret coloca espaços de indentação dentro das aspas em algumas linhas de porção.
  const stripped = String(line || "").replace(/^"/, "");
  const match = stripped.match(/^[ ]*/);
  return match ? match[0].length : 0;
}

function isHeaderRow(cells) {
  const first = decodeHtmlEntities(cells[0] || "").toLowerCase();
  return first === "data" || first.includes("cals");
}

function isDayOrTotalRow(name) {
  const normalized = name.toLowerCase();
  return (
    normalized === "total" ||
    normalized.startsWith("segunda") ||
    normalized.startsWith("terça") ||
    normalized.startsWith("terca") ||
    normalized.startsWith("quarta") ||
    normalized.startsWith("quinta") ||
    normalized.startsWith("sexta") ||
    normalized.startsWith("sábado") ||
    normalized.startsWith("sabado") ||
    normalized.startsWith("domingo") ||
    /\d{4}/.test(normalized)
  );
}

function isMealName(name) {
  const normalized = name.toLowerCase();
  return /^(caf[eé]|almo[cç]o|jantar|lanche|ceia|cola[cç]|snack|breakfast|lunch|dinner)/i.test(
    normalized
  );
}

function cellsToPortionNutrition(cells) {
  return {
    kcal: parseFatSecretNumber(cells[1]),
    fat_g: parseFatSecretNumber(cells[2]),
    sat_fat_g: parseFatSecretNumber(cells[3]),
    carbs_g: parseFatSecretNumber(cells[4]),
    fiber_g: parseFatSecretNumber(cells[5]),
    sugar_g: parseFatSecretNumber(cells[6]),
    protein_g: parseFatSecretNumber(cells[7]),
    sodium_mg: parseFatSecretNumber(cells[8]),
    cholesterol_mg: parseFatSecretNumber(cells[9]),
    potassium_mg: parseFatSecretNumber(cells[10])
  };
}

function toStoredItem(food) {
  const portion = parsePortionLabel(food.portionLabel || `${food.portionG || 100} g`);
  const totalPortionG = portion.portionG || 100;
  const stored = toStoredPortion(
    portion.measureUnit || "gramas",
    portion.measureAmount ?? totalPortionG,
    portion.gramsPerUnit
  );
  const portionNutrition = Object.fromEntries(
    FATSECRET_REPORT_KEYS.map((key) => [key, food.nutrition?.[key] ?? null])
  );

  const per100g = portionNutritionToPer100g(portionNutrition, totalPortionG);
  const snapshot = {
    ...buildNutritionSnapshot(
      per100g,
      stored.measureUnit,
      stored.measureAmount
    ),
    ...Object.fromEntries(FATSECRET_REPORT_KEYS.map((key) => [key, per100g?.[key] ?? null])),
    amountLabel: portion.amountLabel,
    portionEstimated: Boolean(portion.estimated),
    ...(stored.gramsPerUnit ? { gramsPerUnit: stored.gramsPerUnit } : {})
  };

  return {
    source: "fatsecret_csv",
    externalId: null,
    label: food.label,
    quantity: stored.quantity,
    portionG: round(stored.portionG, 1),
    amountLabel: portion.amountLabel,
    nutritionSnapshot: snapshot,
    per100g
  };
}

/**
 * Extrai plano alimentar do CSV Detailed Report do FatSecret.
 * Estrutura esperada:
 * - cabeçalho: Data,Cals,Gord,Sat,Carbs,Fibras,Açúcr,Prot,Sódio,Col,Potássio
 * - 1 espaço: refeição
 * - 2 espaços: alimento + nutrientes da porção
 * - 3 espaços: descrição da porção
 */
export function extractDietPlanFromFatSecretCsv(csvText, options = {}) {
  const lines = String(csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/);

  const meals = [];
  let currentMeal = null;
  let pendingFood = null;
  let reportDate = null;

  function flushFood() {
    if (!pendingFood || !currentMeal) {
      pendingFood = null;
      return;
    }
    currentMeal.items.push(toStoredItem(pendingFood));
    pendingFood = null;
  }

  function flushMeal() {
    flushFood();
    if (currentMeal?.items?.length) meals.push(currentMeal);
    currentMeal = null;
  }

  for (const rawLine of lines) {
    if (!rawLine || rawLine.trim() === "") continue;
    if (rawLine.trim().startsWith("#")) continue;

    const indent = leadingSpaceCount(rawLine);
    const cells = parseCsvLine(rawLine).map((cell) => decodeHtmlEntities(cell.trim()));
    if (!cells.length) continue;
    if (isHeaderRow(cells)) continue;

    const name = cells[0] || "";
    if (!name) continue;

    // Linha só de porção (sem nutrientes)
    const onlyPortion = cells.length === 1 || cells.slice(1).every((cell) => !String(cell || "").trim());
    if (onlyPortion && indent >= 3) {
      if (pendingFood) pendingFood.portionLabel = name;
      continue;
    }

    if (onlyPortion && indent === 0 && /^total$/i.test(name)) continue;

    if (indent === 0) {
      // Dia ou Total — ignora totais; guarda data se parecer data
      if (/^total$/i.test(name)) continue;
      if (isDayOrTotalRow(name)) {
        reportDate = name;
      }
      continue;
    }

    if (indent === 1 || (indent < 2 && isMealName(name))) {
      flushMeal();
      currentMeal = {
        name,
        sortOrder: meals.length,
        items: []
      };
      continue;
    }

    // Alimento (indent >= 2)
    if (!currentMeal) {
      currentMeal = {
        name: "Refeição",
        sortOrder: meals.length,
        items: []
      };
    }

    flushFood();
    pendingFood = {
      label: name,
      nutrition: cellsToPortionNutrition(cells),
      portionLabel: null,
      portionG: null
    };
  }

  flushMeal();

  const title = options.title || "Plano Alimentar";

  return {
    title,
    notes: "",
    status: "active",
    source: "fatsecret_csv",
    meals,
    reportDate
  };
}

export function buildDietExtractionSummary(plan) {
  const mealCount = plan?.meals?.length || 0;
  const itemCount = (plan?.meals || []).reduce((sum, meal) => sum + (meal.items?.length || 0), 0);
  if (!mealCount) {
    return "Não foi possível identificar refeições no CSV. Confirme se é o relatório Detailed Report do FatSecret.";
  }
  return `CSV importado: ${mealCount} refeição(ões) e ${itemCount} item(ns). Revise as porções sem gramas (ex.: “2 pequenos”).`;
}

export async function extractDietPlanFromCsvBuffer(buffer, options = {}) {
  const text = Buffer.isBuffer(buffer) ? buffer.toString("utf8") : String(buffer || "");
  const plan = extractDietPlanFromFatSecretCsv(text, options);
  return {
    extractedText: text.slice(0, 50000),
    plan,
    method: "fatsecret_csv",
    warning: null,
    summary: buildDietExtractionSummary(plan)
  };
}
