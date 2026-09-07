import { ALL_NUTRIENT_KEYS, sanitizePer100g } from "@/lib/foods/nutrition";
import { buildNutritionSnapshot } from "@/lib/foods/measures";

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(value || 0) * factor) / factor;
}

function parseNumber(value) {
  if (value == null || value === "") return null;
  const match = String(value).replace(",", ".").match(/-?\d+\.?\d*/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function extractTextFromPdfBuffer(buffer) {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const parsed = await pdfParse(buffer);
    return String(parsed.text || "").trim();
  } catch {
    return "";
  }
}

/**
 * Converte nutrientes da porção informada no PDF em valores /100g.
 */
export function portionNutritionToPer100g(portionNutrition, portionG) {
  const grams = Number(portionG);
  if (!portionNutrition || !Number.isFinite(grams) || grams <= 0) {
    return sanitizePer100g(portionNutrition) || null;
  }

  const factor = 100 / grams;
  const per100g = {};

  for (const key of ALL_NUTRIENT_KEYS) {
    const value = portionNutrition[key];
    if (value == null || value === "") continue;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) continue;
    per100g[key] = round(parsed * factor, key === "kcal" ? 0 : 1);
  }

  return sanitizePer100g(per100g);
}

function normalizeMealName(name, index) {
  const cleaned = String(name || "").trim();
  if (cleaned) return cleaned;
  return `Refeição ${index + 1}`;
}

function normalizeExtractedItem(rawItem) {
  const label = String(rawItem?.label || rawItem?.name || "").trim();
  if (!label) return null;

  let portionG = parseNumber(rawItem?.portionG ?? rawItem?.portion_g ?? rawItem?.grams);
  const amountLabel = String(rawItem?.amountLabel || rawItem?.amount || "").trim();

  if ((!portionG || portionG <= 0) && amountLabel) {
    const gramsMatch = amountLabel.match(/(\d+[.,]?\d*)\s*g\b/i);
    const mlMatch = amountLabel.match(/(\d+[.,]?\d*)\s*ml\b/i);
    if (gramsMatch) portionG = parseNumber(gramsMatch[1]);
    else if (mlMatch) portionG = parseNumber(mlMatch[1]);
  }

  if (!portionG || portionG <= 0) portionG = 100;

  const portionNutrition = {
    kcal: parseNumber(rawItem?.kcal ?? rawItem?.calories ?? rawItem?.nutrition?.kcal),
    protein_g: parseNumber(rawItem?.protein_g ?? rawItem?.protein ?? rawItem?.nutrition?.protein_g),
    carbs_g: parseNumber(rawItem?.carbs_g ?? rawItem?.carbs ?? rawItem?.nutrition?.carbs_g),
    fat_g: parseNumber(rawItem?.fat_g ?? rawItem?.fat ?? rawItem?.nutrition?.fat_g),
    fiber_g: parseNumber(rawItem?.fiber_g ?? rawItem?.fiber ?? rawItem?.nutrition?.fiber_g),
    sodium_mg: parseNumber(rawItem?.sodium_mg ?? rawItem?.sodium ?? rawItem?.nutrition?.sodium_mg)
  };

  const hasAnyNutrient = Object.values(portionNutrition).some((value) => value != null);
  const per100g = hasAnyNutrient ? portionNutritionToPer100g(portionNutrition, portionG) : null;

  return {
    source: "fatsecret_pdf",
    externalId: null,
    label,
    quantity: 1,
    portionG: round(portionG, 1),
    amountLabel: amountLabel || `${round(portionG, 1)}g`,
    nutritionSnapshot: buildNutritionSnapshot(per100g, "gramas", portionG),
    per100g
  };
}

export function normalizeExtractedDietPlan(raw, fallbackTitle = "Plano alimentar FatSecret") {
  const title = String(raw?.title || fallbackTitle).trim() || fallbackTitle;
  const notes = String(raw?.notes || "").trim() || null;
  const mealsRaw = Array.isArray(raw?.meals) ? raw.meals : [];

  const meals = mealsRaw
    .map((meal, index) => {
      const items = (Array.isArray(meal?.items) ? meal.items : [])
        .map(normalizeExtractedItem)
        .filter(Boolean);

      return {
        name: normalizeMealName(meal?.name, index),
        sortOrder: Number.isFinite(Number(meal?.sortOrder)) ? Number(meal.sortOrder) : index,
        items
      };
    })
    .filter((meal) => meal.items.length > 0);

  return {
    title,
    notes,
    status: "active",
    source: "fatsecret_pdf",
    meals
  };
}

/**
 * Heurística para PDFs FatSecret / planos textuais quando a IA não está disponível.
 * Procura blocos de refeição e linhas com kcal.
 */
export function extractDietPlanFromTextHeuristic(text, options = {}) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const mealHeader =
    /^(caf[eé](?:\s+da\s+manh[aã])?|desayuno|breakfast|almo[cç]o|lunch|lanche(?:\s+\d+)?|snack|jantar|dinner|ceia|supper|pr[eé][- ]?treino|p[oó]s[- ]?treino|cola[cç][aã]o)(?=\s|$|[:\-–—])/i;

  const meals = [];
  let current = null;

  function pushCurrent() {
    if (current?.items?.length) meals.push(current);
  }

  for (const line of lines) {
    if (mealHeader.test(line) && line.length < 60) {
      pushCurrent();
      current = {
        name: line.replace(/[:\-–—]+$/, "").trim(),
        items: []
      };
      continue;
    }

    if (!current) {
      current = { name: "Refeição 1", items: [] };
    }

    const kcalMatch = line.match(/(\d+[.,]?\d*)\s*kcal/i);
    if (!kcalMatch) continue;

    const gramsMatch = line.match(/(\d+[.,]?\d*)\s*g\b/i);
    const mlMatch = line.match(/(\d+[.,]?\d*)\s*ml\b/i);
    const portionG = parseNumber(gramsMatch?.[1] || mlMatch?.[1]) || 100;

    let label = line
      .replace(/\d+[.,]?\d*\s*kcal.*/i, "")
      .replace(/\(?\s*\d+[.,]?\d*\s*(g|ml)\s*\)?/gi, "")
      .replace(/[|·•]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    if (!label || label.length < 2) label = "Item alimentar";

    const protein = line.match(/P(?:rot(?:e[ií]na)?)?[:\s]*(\d+[.,]?\d*)\s*g/i);
    const carbs = line.match(/C(?:arb(?:oidrato)?|arbos?)?[:\s]*(\d+[.,]?\d*)\s*g/i);
    const fat = line.match(/G(?:ordura|ord)?[:\s]*(\d+[.,]?\d*)\s*g|F(?:at)?[:\s]*(\d+[.,]?\d*)\s*g/i);

    current.items.push({
      label,
      portionG,
      amountLabel: gramsMatch ? `${gramsMatch[1]}g` : mlMatch ? `${mlMatch[1]}ml` : `${portionG}g`,
      kcal: parseNumber(kcalMatch[1]),
      protein_g: parseNumber(protein?.[1]),
      carbs_g: parseNumber(carbs?.[1]),
      fat_g: parseNumber(fat?.[1] || fat?.[2])
    });
  }

  pushCurrent();

  return normalizeExtractedDietPlan(
    {
      title: options.title || "Plano alimentar FatSecret",
      notes: options.notes || "Extraído automaticamente do PDF. Revise antes de publicar.",
      meals
    },
    options.title
  );
}

async function extractDietPlanWithOpenAI(text, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !text) return null;

  const model = process.env.OPENAI_DIET_MODEL || "gpt-4o-mini";
  const truncated = text.slice(0, 24000);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Você extrai planos alimentares de PDFs do FatSecret (ou similares) para JSON. " +
            "Responda somente JSON válido no formato: " +
            '{"title":"string","notes":"string|null","meals":[{"name":"string","sortOrder":0,"items":[{"label":"string","portionG":number,"amountLabel":"string","kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"fiber_g":number|null,"sodium_mg":number|null}]}]}. ' +
            "portionG deve ser a porção em gramas (ou ml ≈ g). Os nutrientes são da PORÇÃO, não por 100g. " +
            "Ignore anúncios, rodapé e textos de marketing. Se não houver dados, retorne meals:[]."
        },
        {
          role: "user",
          content: `Texto do PDF da dieta:\n\n${truncated}`
        }
      ]
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`OpenAI falhou (${response.status}): ${details.slice(0, 200)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) return null;

  const parsed = JSON.parse(content);
  return normalizeExtractedDietPlan(parsed, options.title);
}

export function buildDietExtractionSummary(plan) {
  const mealCount = plan?.meals?.length || 0;
  const itemCount = (plan?.meals || []).reduce((sum, meal) => sum + (meal.items?.length || 0), 0);
  if (!mealCount) {
    return "Não foi possível identificar refeições no PDF. Revise o arquivo ou preencha manualmente os dados.";
  }
  return `Extração concluída: ${mealCount} refeição(ões) e ${itemCount} item(ns). Revise os valores antes de salvar.`;
}

export async function extractDietPlanFromPdfBuffer(buffer, options = {}) {
  const extractedText = await extractTextFromPdfBuffer(buffer);
  let plan = null;
  let method = "none";
  let warning = null;

  if (extractedText) {
    try {
      plan = await extractDietPlanWithOpenAI(extractedText, options);
      if (plan?.meals?.length) method = "openai";
    } catch (error) {
      warning = error.message || "Falha na extração com IA.";
      console.error("Diet OpenAI extraction failed:", error);
    }

    if (!plan?.meals?.length) {
      plan = extractDietPlanFromTextHeuristic(extractedText, options);
      if (plan?.meals?.length) method = "heuristic";
    }
  }

  if (!plan) {
    plan = normalizeExtractedDietPlan({ title: options.title, meals: [] }, options.title);
  }

  return {
    extractedText: extractedText.slice(0, 50000),
    plan,
    method,
    warning,
    summary: buildDietExtractionSummary(plan)
  };
}
