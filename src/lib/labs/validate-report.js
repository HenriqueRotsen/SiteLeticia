import { generateGeminiContent, hasGeminiConfigured, canSendPdfInline } from "@/lib/ai/gemini";
import { resolveAiProvider } from "@/lib/ai/provider";

function normalizePersonName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nameLooksLikeSamePerson(expected, detected) {
  const left = normalizePersonName(expected);
  const right = normalizePersonName(detected);
  if (!left || !right) return null;

  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = left.split(" ").filter((t) => t.length > 2);
  const rightTokens = new Set(right.split(" ").filter((t) => t.length > 2));
  if (leftTokens.length < 2) return leftTokens.some((t) => rightTokens.has(t));

  const overlap = leftTokens.filter((t) => rightTokens.has(t)).length;
  return overlap >= 2;
}

function parseIsoDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const d = new Date(raw.slice(0, 10) + "T12:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // DD/MM/YYYY
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    const d = new Date(`${br[3]}-${br[2].padStart(2, "0")}-${br[1].padStart(2, "0")}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Busca a data de referência da consulta (último atendimento passado ou criação do plano ativo).
 */
export async function resolveConsultationReferenceDate(supabase, patientId) {
  const nowIso = new Date().toISOString();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("starts_at, status")
    .eq("patient_id", patientId)
    .lte("starts_at", nowIso)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: false })
    .limit(1);

  if (appointments?.[0]?.starts_at) {
    return {
      consultationAt: new Date(appointments[0].starts_at),
      source: "appointment"
    };
  }

  const { data: plans } = await supabase
    .from("diet_plans")
    .select("created_at, status")
    .eq("patient_id", patientId)
    .in("status", ["active", "archived"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (plans?.[0]?.created_at) {
    return {
      consultationAt: new Date(plans[0].created_at),
      source: "diet_plan"
    };
  }

  return { consultationAt: null, source: "none" };
}

async function extractValidationWithGemini({
  pdfBuffer,
  extractedText,
  expectedPatientName,
  consultationAt
}) {
  if (!hasGeminiConfigured() || resolveAiProvider() !== "gemini") return null;

  const system =
    "Você valida laudos laboratoriais brasileiros. Responda somente JSON válido: " +
    '{"patientNameOnReport":"string|null","reportDate":"YYYY-MM-DD|null","matchesExpectedPatient":true|false|null,"notes":"string"}. ' +
    "matchesExpectedPatient deve comparar o nome do laudo com o nome esperado (aceite variações curtas/abreviações). " +
    "reportDate é a data de coleta ou emissão do laudo. Não invente dados.";

  const prompt = [
    `Nome esperado do paciente: ${expectedPatientName}`,
    consultationAt
      ? `Data de referência da consulta: ${consultationAt.toISOString().slice(0, 10)}`
      : "Data de referência da consulta: desconhecida",
    "",
    extractedText?.trim()
      ? `Texto do PDF:\n${extractedText.slice(0, 20000)}`
      : "Analise o PDF anexado e extraia nome do paciente e data do laudo."
  ].join("\n");

  const response = await generateGeminiContent({
    system,
    prompt,
    pdfBuffer:
      !extractedText?.trim() && canSendPdfInline(pdfBuffer)
        ? pdfBuffer
        : extractedText?.trim()?.length < 400 && canSendPdfInline(pdfBuffer)
          ? pdfBuffer
          : null,
    json: true,
    temperature: 0
  });

  return response?.data || null;
}

/**
 * Valida se o laudo é do paciente e se é anterior/posterior à consulta.
 * declaredTiming: "before" | "after" | null
 */
export async function validateLabReportIdentityAndTiming({
  pdfBuffer,
  extractedText = "",
  expectedPatientName,
  consultationAt,
  declaredTiming = null
} = {}) {
  let detected = {
    patientNameOnReport: null,
    reportDate: null,
    matchesExpectedPatient: null,
    notes: ""
  };

  try {
    const ai = await extractValidationWithGemini({
      pdfBuffer,
      extractedText,
      expectedPatientName,
      consultationAt
    });
    if (ai) {
      detected = {
        patientNameOnReport: ai.patientNameOnReport || ai.patient_name || null,
        reportDate: ai.reportDate || ai.report_date || null,
        matchesExpectedPatient:
          typeof ai.matchesExpectedPatient === "boolean"
            ? ai.matchesExpectedPatient
            : typeof ai.matches_expected_patient === "boolean"
              ? ai.matches_expected_patient
              : null,
        notes: ai.notes || ""
      };
    }
  } catch (error) {
    detected.notes = error.message || "Falha na validação por IA.";
  }

  const heuristicMatch = nameLooksLikeSamePerson(
    expectedPatientName,
    detected.patientNameOnReport
  );

  const matchesPatient =
    detected.matchesExpectedPatient === false
      ? false
      : detected.matchesExpectedPatient === true
        ? true
        : heuristicMatch;

  const reportDate = parseIsoDate(detected.reportDate);
  let timing = "unknown";

  if (reportDate && consultationAt) {
    timing =
      startOfDay(reportDate).getTime() >= startOfDay(consultationAt).getTime()
        ? "after"
        : "before";
  } else if (declaredTiming === "before" || declaredTiming === "after") {
    timing = declaredTiming;
  }

  // Paciente disse "depois", mas a data no laudo é anterior → tratar como anterior.
  if (declaredTiming === "after" && timing === "before") {
    timing = "before";
  }
  // Paciente disse "antes" e não há data → respeitar declaração.
  if (declaredTiming === "before" && timing === "unknown") {
    timing = "before";
  }
  if (declaredTiming === "after" && timing === "unknown") {
    timing = "after";
  }

  if (matchesPatient === false) {
    return {
      ok: false,
      code: "wrong_patient",
      message:
        "Este laudo não parece ser deste paciente (nome no PDF não confere). O envio foi barrado.",
      matchesPatient: false,
      timing,
      reportDate: reportDate ? reportDate.toISOString().slice(0, 10) : null,
      detectedPatientName: detected.patientNameOnReport,
      usableForOrders: false,
      notes: detected.notes
    };
  }

  if (timing === "before") {
    return {
      ok: true,
      code: "before_consultation",
      message:
        "Laudo aceito, mas é anterior à consulta. Ele fica arquivado e não preenche os exames solicitados.",
      matchesPatient: matchesPatient !== false,
      timing: "before",
      reportDate: reportDate ? reportDate.toISOString().slice(0, 10) : null,
      detectedPatientName: detected.patientNameOnReport,
      usableForOrders: false,
      notes: detected.notes
    };
  }

  return {
    ok: true,
    code: "ok",
    message: "Laudo validado para o paciente.",
    matchesPatient: matchesPatient !== false,
    timing: timing === "after" ? "after" : "unknown",
    reportDate: reportDate ? reportDate.toISOString().slice(0, 10) : null,
    detectedPatientName: detected.patientNameOnReport,
    usableForOrders: true,
    notes: detected.notes
  };
}
