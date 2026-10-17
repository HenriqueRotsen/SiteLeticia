import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { canSendPdfInline, generateGeminiContent, hasGeminiConfigured } from "@/lib/ai/gemini";
import { resolveAiProvider } from "@/lib/ai/provider";
import {
  KNOWN_MARKER_KEYS,
  MARKER_PATTERNS,
  buildClinicalGuidePromptContext,
  buildClinicalInterpretationSummary,
  enrichResultsWithClinicalGuide
} from "@/lib/labs/clinical-guide";

function parseNumeric(value) {
  if (value == null) return null;
  const normalized = String(value).replace(",", ".").match(/-?\d+\.?\d*/);
  return normalized ? Number(normalized[0]) : null;
}

function inferFlag(value, refMin, refMax) {
  if (value == null) return "unknown";
  if (refMin != null && value < refMin) return "low";
  if (refMax != null && value > refMax) return "high";
  return "normal";
}

export function extractMarkersFromText(text) {
  const lines = text.split(/\n+/);
  const results = [];

  for (const line of lines) {
    for (const pattern of MARKER_PATTERNS) {
      if (!pattern.regex.test(line)) continue;
      const numbers = line.match(/-?\d+[.,]?\d*/g);
      if (!numbers?.length) continue;
      const value = parseNumeric(numbers[0]);
      results.push({
        marker_key: pattern.key,
        marker_name: line.slice(0, 80).trim(),
        value,
        value_text: numbers[0],
        unit: line.match(/mg\/dL|ng\/mL|pg\/mL|mUI\/L|µUI\/mL|uUI\/mL|g\/dL|U\/L|mL\/min|%/i)?.[0] || null
      });
      break;
    }
  }

  return enrichResultsWithClinicalGuide(results);
}

export async function enrichResultsWithReferences(results) {
  const withGuide = enrichResultsWithClinicalGuide(results);
  const supabase = createSupabaseAdmin();
  const keys = [...new Set(withGuide.map((r) => r.marker_key).filter(Boolean))];
  if (!keys.length) {
    return withGuide.map((result) => ({ ...result, flag: result.flag || "unknown" }));
  }

  let refs = [];
  try {
    const { data } = await supabase.from("lab_reference_ranges").select("*").in("marker_key", keys);
    refs = data || [];
  } catch {
    refs = [];
  }

  const refMap = Object.fromEntries(refs.map((r) => [r.marker_key, r]));

  return enrichResultsWithClinicalGuide(
    withGuide.map((result) => {
      const ref = refMap[result.marker_key];
      const refMin = result.ref_min ?? ref?.ref_min ?? null;
      const refMax = result.ref_max ?? ref?.ref_max ?? null;
      const value = result.value ?? parseNumeric(result.value_text);
      return {
        ...result,
        value,
        marker_name: result.marker_name || ref?.name || result.marker_key,
        unit: result.unit || ref?.unit || null,
        ref_min: refMin,
        ref_max: refMax,
        flag: result.flag && result.flag !== "unknown" ? result.flag : inferFlag(value, refMin, refMax)
      };
    })
  );
}

export function buildInterpretationSummary(results, refs) {
  const clinical = buildClinicalInterpretationSummary(results);
  if (clinical && results?.length) return clinical;

  const refMap = Object.fromEntries((refs || []).map((r) => [r.marker_key, r]));
  const altered = (results || []).filter((r) => r.flag === "low" || r.flag === "high");

  if (!altered.length) {
    return "Nenhum marcador identificado fora da faixa de referência. A interpretação clínica integrada é responsabilidade da nutricionista.";
  }

  return altered
    .map((r) => {
      const note = r.clinical_note || refMap[r.marker_key]?.interpretation_notes || "";
      const status = r.flag === "high" ? "acima" : "abaixo";
      return `${r.marker_name}: valor ${status} da referência. ${note}`.trim();
    })
    .join("\n\n");
}

function normalizeGeminiLabResults(rawResults = []) {
  return (rawResults || [])
    .map((item) => {
      const markerKey = String(item.marker_key || item.markerKey || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_");
      const value = parseNumeric(item.value ?? item.value_text);
      const flag = ["low", "high", "normal", "unknown"].includes(item.flag) ? item.flag : "unknown";

      return {
        marker_key: KNOWN_MARKER_KEYS.includes(markerKey) ? markerKey : markerKey || "other",
        marker_name: String(item.marker_name || item.markerName || markerKey || "Marcador").slice(0, 120),
        value,
        value_text: item.value_text != null ? String(item.value_text) : value != null ? String(value) : null,
        unit: item.unit ? String(item.unit) : null,
        ref_min: parseNumeric(item.ref_min ?? item.refMin),
        ref_max: parseNumeric(item.ref_max ?? item.refMax),
        flag
      };
    })
    .filter((item) => item.marker_name && (item.value != null || item.value_text));
}

async function extractLabWithGemini(buffer, text) {
  if (!hasGeminiConfigured()) return null;

  const hasText = Boolean(text?.trim());
  const canPdf = canSendPdfInline(buffer);

  if (!hasText && !canPdf) return null;

  const guideContext = buildClinicalGuidePromptContext();

  const system =
    "Você analisa laudos laboratoriais brasileiros para nutricionistas. " +
    "Responda somente JSON válido. Não invente valores. " +
    "Use marker_key entre: " +
    KNOWN_MARKER_KEYS.join(", ") +
    " quando possível. " +
    'Formato: {"interpretationSummary":"string","results":[{"marker_key":"string","marker_name":"string","value":number|null,"value_text":"string|null","unit":"string|null","ref_min":number|null,"ref_max":number|null,"flag":"low|high|normal|unknown"}]}. ' +
    "flag compara com a referência impressa no laudo (ou com o guia se o laudo não trouxer faixa). " +
    "interpretationSummary: parecer inicial em português usando o guia clínico (referência lab + ideal preventivo + prazo de reavaliação). " +
    "Não feche diagnóstico; linguagem de apoio à nutricionista.";

  const prompt = [
    guideContext,
    "",
    hasText
      ? `Extraia marcadores e um parecer inicial deste laudo.\n\nTexto do PDF:\n${text.slice(0, 28000)}`
      : "Extraia marcadores e um parecer inicial deste laudo em PDF (pode ser escaneado). Se não conseguir ler, retorne results:[ ] e explique em interpretationSummary."
  ].join("\n");

  const shouldAttachPdf = !hasText || (canPdf && text.trim().length < 400);

  const response = await generateGeminiContent({
    system,
    prompt,
    pdfBuffer: shouldAttachPdf ? buffer : null,
    json: true,
    temperature: 0.1
  });

  if (!response?.data) return null;

  const rawResults = normalizeGeminiLabResults(response.data.results || response.data.markers || []);
  const results = await enrichResultsWithReferences(rawResults);
  const aiSummary = String(
    response.data.interpretationSummary || response.data.interpretation_summary || ""
  ).trim();
  const guideSummary = buildClinicalInterpretationSummary(results);
  const summary = [aiSummary, guideSummary].filter(Boolean).join("\n\n") || buildInterpretationSummary(results, []);

  return {
    results,
    interpretationSummary: summary,
    method: "gemini"
  };
}

export async function extractLabReportFromPdfBuffer(buffer) {
  let text = "";
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const parsed = await pdfParse(buffer);
    text = parsed.text || "";
  } catch {
    text = "";
  }

  const provider = resolveAiProvider();

  let geminiError = null;
  if (provider === "gemini") {
    try {
      const gemini = await extractLabWithGemini(buffer, text);
      if (gemini?.results?.length || gemini?.interpretationSummary) {
        return {
          extractedText: text.slice(0, 50000),
          results: gemini.results || [],
          interpretationSummary: gemini.interpretationSummary,
          method: "gemini"
        };
      }
    } catch (error) {
      geminiError = error?.message || "Falha na chamada Gemini.";
      console.error("Lab Gemini extraction failed:", error);
    }
  }

  if (!text.trim()) {
    return {
      extractedText: "",
      results: [],
      interpretationSummary: geminiError
        ? `Não foi possível analisar o PDF automaticamente (${geminiError}). Revise o laudo manualmente.`
        : hasGeminiConfigured()
          ? "Não foi possível analisar o PDF automaticamente. Confira o modelo Gemini / tamanho do arquivo ou revise o laudo manualmente."
          : "Não foi possível ler o texto do PDF (pode ser escaneado/imagem, sem camada de texto). Configure GEMINI_API_KEY para análise por IA ou revise o laudo manualmente.",
      method: "none"
    };
  }

  const rawResults = extractMarkersFromText(text);
  const results = await enrichResultsWithReferences(rawResults);

  let refs = [];
  try {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase.from("lab_reference_ranges").select("*");
    refs = data || [];
  } catch {
    refs = [];
  }

  const interpretationSummary = results.length
    ? buildInterpretationSummary(results, refs)
    : "O PDF tem texto, mas nenhum marcador do guia clínico foi identificado automaticamente. Revise o laudo manualmente.";

  return {
    extractedText: text.slice(0, 50000),
    results,
    interpretationSummary,
    method: results.length ? "regex" : "none"
  };
}
