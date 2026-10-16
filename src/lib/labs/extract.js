import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { canSendPdfInline, generateGeminiContent, hasGeminiConfigured } from "@/lib/ai/gemini";
import { resolveAiProvider } from "@/lib/ai/provider";

const KNOWN_MARKER_KEYS = [
  "glucose_fasting",
  "hba1c",
  "total_cholesterol",
  "ldl",
  "hdl",
  "triglycerides",
  "ferritin",
  "vitamin_d",
  "vitamin_b12",
  "tsh",
  "tgo",
  "tgp"
];

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

const MARKER_PATTERNS = [
  { key: "glucose_fasting", regex: /glicemia|glucose|glicose/i },
  { key: "hba1c", regex: /hemoglobina glicada|hba1c|a1c/i },
  { key: "total_cholesterol", regex: /colesterol total/i },
  { key: "ldl", regex: /\bldl\b/i },
  { key: "hdl", regex: /\bhdl\b/i },
  { key: "triglycerides", regex: /triglicer/i },
  { key: "ferritin", regex: /ferritina/i },
  { key: "vitamin_d", regex: /vitamina d|25.?oh/i },
  { key: "vitamin_b12", regex: /vitamina b12|b12/i },
  { key: "tsh", regex: /\btsh\b/i },
  { key: "tgo", regex: /\btgo\b|\bast\b/i },
  { key: "tgp", regex: /\btgp\b|\balt\b/i }
];

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
        unit: line.match(/mg\/dL|ng\/mL|pg\/mL|mUI\/L|g\/dL|U\/L|%/i)?.[0] || null
      });
      break;
    }
  }

  return results;
}

export async function enrichResultsWithReferences(results) {
  const supabase = createSupabaseAdmin();
  const keys = [...new Set(results.map((r) => r.marker_key).filter(Boolean))];
  if (!keys.length) return results.map((result) => ({ ...result, flag: result.flag || "unknown" }));

  const { data: refs } = await supabase.from("lab_reference_ranges").select("*").in("marker_key", keys);

  const refMap = Object.fromEntries((refs || []).map((r) => [r.marker_key, r]));

  return results.map((result) => {
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
  });
}

export function buildInterpretationSummary(results, refs) {
  const refMap = Object.fromEntries((refs || []).map((r) => [r.marker_key, r]));
  const altered = results.filter((r) => r.flag === "low" || r.flag === "high");

  if (!altered.length) {
    return "Nenhum marcador identificado fora da faixa de referência cadastrada. A interpretação clínica integrada é responsabilidade da nutricionista.";
  }

  return altered
    .map((r) => {
      const note = refMap[r.marker_key]?.interpretation_notes || "";
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
        .toLowerCase();
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

  const system =
    "Você analisa laudos laboratoriais brasileiros para nutricionistas. " +
    "Responda somente JSON válido. Não invente valores. " +
    "Use marker_key entre: " +
    KNOWN_MARKER_KEYS.join(", ") +
    " quando possível. " +
    'Formato: {"interpretationSummary":"string","results":[{"marker_key":"string","marker_name":"string","value":number|null,"value_text":"string|null","unit":"string|null","ref_min":number|null,"ref_max":number|null,"flag":"low|high|normal|unknown"}]}. ' +
    "interpretationSummary deve ser um parecer inicial objetivo em português, destacando alterações; a nutricionista revisará antes de publicar.";

  const prompt = hasText
    ? `Extraia marcadores e um parecer inicial deste laudo.\n\nTexto do PDF:\n${text.slice(0, 30000)}`
    : "Extraia marcadores e um parecer inicial deste laudo em PDF. Se não conseguir ler, retorne results:[ ] e explique em interpretationSummary.";

  const response = await generateGeminiContent({
    system,
    prompt,
    pdfBuffer: hasText ? null : buffer,
    json: true,
    temperature: 0.1
  });

  if (!response?.data) return null;

  const rawResults = normalizeGeminiLabResults(response.data.results || response.data.markers || []);
  const results = await enrichResultsWithReferences(rawResults);
  const summary =
    String(response.data.interpretationSummary || response.data.interpretation_summary || "").trim() ||
    buildInterpretationSummary(results, []);

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
      console.error("Lab Gemini extraction failed:", error);
    }
  }

  if (!text.trim()) {
    return {
      extractedText: "",
      results: [],
      interpretationSummary: hasGeminiConfigured()
        ? "Não foi possível analisar o PDF automaticamente. Confira a chave Gemini / tamanho do arquivo ou revise o laudo manualmente."
        : "Não foi possível ler o texto do PDF (pode ser escaneado/imagem, sem camada de texto). Configure GEMINI_API_KEY para análise por IA ou revise o laudo manualmente.",
      method: "none"
    };
  }

  const rawResults = extractMarkersFromText(text);
  const results = await enrichResultsWithReferences(rawResults);

  const supabase = createSupabaseAdmin();
  const { data: refs } = await supabase.from("lab_reference_ranges").select("*");

  const interpretationSummary = results.length
    ? buildInterpretationSummary(results, refs || [])
    : "O PDF tem texto, mas nenhum marcador cadastrado foi identificado automaticamente. Revise o laudo manualmente.";

  return {
    extractedText: text.slice(0, 50000),
    results,
    interpretationSummary,
    method: results.length ? "regex" : "none"
  };
}
