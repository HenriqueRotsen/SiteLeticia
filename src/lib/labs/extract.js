import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

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
  const keys = [...new Set(results.map((r) => r.marker_key))];
  const { data: refs } = await supabase
    .from("lab_reference_ranges")
    .select("*")
    .in("marker_key", keys);

  const refMap = Object.fromEntries((refs || []).map((r) => [r.marker_key, r]));

  return results.map((result) => {
    const ref = refMap[result.marker_key];
    const refMin = ref?.ref_min ?? null;
    const refMax = ref?.ref_max ?? null;
    return {
      ...result,
      marker_name: ref?.name || result.marker_name,
      unit: result.unit || ref?.unit || null,
      ref_min: refMin,
      ref_max: refMax,
      flag: inferFlag(result.value, refMin, refMax)
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
  const rawResults = extractMarkersFromText(text);
  const results = await enrichResultsWithReferences(rawResults);

  const supabase = createSupabaseAdmin();
  const { data: refs } = await supabase.from("lab_reference_ranges").select("*");

  return {
    extractedText: text.slice(0, 50000),
    results,
    interpretationSummary: buildInterpretationSummary(results, refs || [])
  };
}
