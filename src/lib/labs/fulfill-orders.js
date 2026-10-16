import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { canSendPdfInline, generateGeminiContent, hasGeminiConfigured } from "@/lib/ai/gemini";
import { resolveAiProvider } from "@/lib/ai/provider";
import { isExamDone } from "@/lib/labs/exam-status";

function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseNumeric(value) {
  if (value == null || value === "") return null;
  const match = String(value).replace(",", ".").match(/-?\d+\.?\d*/);
  return match ? Number(match[0]) : null;
}

function namesMatch(requested, candidate) {
  const left = normalizeName(requested);
  const right = normalizeName(candidate);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = left.split(/\s+/).filter((t) => t.length > 2);
  const rightTokens = new Set(right.split(/\s+/).filter((t) => t.length > 2));
  if (!leftTokens.length) return false;
  const overlap = leftTokens.filter((token) => rightTokens.has(token)).length;
  return overlap >= Math.min(2, leftTokens.length);
}

function buildResultPayload({ match, reportId, source = "auto" }) {
  const value = parseNumeric(match.value ?? match.value_text);
  const flag = ["low", "high", "normal", "unknown"].includes(match.flag) ? match.flag : "unknown";

  return {
    status: "done",
    result: {
      value,
      value_text: match.value_text != null ? String(match.value_text) : value != null ? String(value) : null,
      unit: match.unit ? String(match.unit) : null,
      ref_min: parseNumeric(match.ref_min ?? match.refMin),
      ref_max: parseNumeric(match.ref_max ?? match.refMax),
      flag,
      matched_name: match.matched_name || match.marker_name || match.examName || null,
      report_id: reportId,
      matched_at: new Date().toISOString(),
      source
    }
  };
}

function heuristicMatches(requestedExams, labResults = []) {
  return requestedExams.map((exam) => {
    const hit = (labResults || []).find((result) => namesMatch(exam.name, result.marker_name));
    if (!hit) {
      return { examName: exam.name, matched: false };
    }
    return {
      examName: exam.name,
      matched: true,
      value: hit.value,
      value_text: hit.value_text,
      unit: hit.unit,
      ref_min: hit.ref_min,
      ref_max: hit.ref_max,
      flag: hit.flag || "unknown",
      matched_name: hit.marker_name
    };
  });
}

async function geminiMatches({ requestedExams, labResults, extractedText, pdfBuffer }) {
  if (!hasGeminiConfigured() || resolveAiProvider() !== "gemini") return null;

  const system =
    "Você compara um laudo laboratorial com a lista de exames solicitados pela nutricionista. " +
    "Responda somente JSON válido no formato: " +
    '{"interpretationSummary":"string","matches":[{"examName":"string","matched":true,"value":number|null,"value_text":"string|null","unit":"string|null","ref_min":number|null,"ref_max":number|null,"flag":"low|high|normal|unknown","matched_name":"string|null"}]}. ' +
    "Para cada exame solicitado, diga se aparece no laudo. Não invente valores. " +
    "flag: normal se dentro da referência do laudo; high/low se fora; unknown se não souber. " +
    "interpretationSummary: parecer inicial em português focado nos exames solicitados.";

  const prompt = [
    "Exames solicitados:",
    JSON.stringify(
      requestedExams.map((exam) => ({ name: exam.name, category: exam.category || "principal" })),
      null,
      2
    ),
    "",
    "Marcadores já extraídos (podem estar incompletos):",
    JSON.stringify(
      (labResults || []).map((item) => ({
        marker_name: item.marker_name,
        value: item.value,
        value_text: item.value_text,
        unit: item.unit,
        ref_min: item.ref_min,
        ref_max: item.ref_max,
        flag: item.flag
      })),
      null,
      2
    ),
    "",
    extractedText?.trim()
      ? `Texto do PDF:\n${extractedText.slice(0, 28000)}`
      : "Analise o PDF anexado e preencha os matches."
  ].join("\n");

  const response = await generateGeminiContent({
    system,
    prompt,
    pdfBuffer: extractedText?.trim() ? null : canSendPdfInline(pdfBuffer) ? pdfBuffer : null,
    json: true,
    temperature: 0.1
  });

  if (!response?.data) return null;

  const matches = Array.isArray(response.data.matches) ? response.data.matches : [];
  return {
    interpretationSummary: String(response.data.interpretationSummary || "").trim() || null,
    matches: matches.map((item) => ({
      examName: item.examName || item.exam_name || "",
      matched: Boolean(item.matched),
      value: item.value,
      value_text: item.value_text,
      unit: item.unit,
      ref_min: item.ref_min ?? item.refMin,
      ref_max: item.ref_max ?? item.refMax,
      flag: item.flag,
      matched_name: item.matched_name || item.matchedName || null
    })),
    method: "gemini"
  };
}

function applyMatchesToOrders(orders, matches, reportId, source) {
  let doneCount = 0;
  const updatedOrders = (orders || []).map((order) => {
    const exams = (order.exams || []).map((exam) => {
      if (isExamDone(exam)) return exam;

      const match =
        matches.find((item) => item.matched && namesMatch(exam.name, item.examName)) ||
        matches.find((item) => item.matched && namesMatch(exam.name, item.matched_name));

      if (!match) return { ...exam, status: exam.status || "pending" };

      doneCount += 1;
      return {
        ...exam,
        ...buildResultPayload({ match, reportId, source })
      };
    });

    return { ...order, exams };
  });

  return { updatedOrders, doneCount };
}

/**
 * Após upload de laudo: analisa contra pedidos ativos e marca itens feitos.
 */
export async function fulfillExamOrdersFromLabReport({
  patientId,
  reportId,
  labResults = [],
  extractedText = "",
  pdfBuffer = null,
  currentInterpretation = ""
} = {}) {
  const supabase = createSupabaseAdmin();

  const { data: plans } = await supabase
    .from("diet_plans")
    .select("id, status, diet_exam_orders(*)")
    .eq("patient_id", patientId)
    .in("status", ["active", "draft"])
    .order("created_at", { ascending: false });

  const orders = (plans || []).flatMap((plan) =>
    (plan.diet_exam_orders || []).map((order) => ({ ...order, _plan_id: plan.id }))
  );

  if (!orders.length) {
    return {
      doneCount: 0,
      interpretationSummary: currentInterpretation || null,
      method: "none",
      orders: []
    };
  }

  const requestedExams = orders.flatMap((order) =>
    (order.exams || [])
      .filter((exam) => !isExamDone(exam))
      .map((exam) => ({
        name: exam.name,
        category: exam.category || "principal",
        orderId: order.id
      }))
  );

  if (!requestedExams.length) {
    return {
      doneCount: 0,
      interpretationSummary: currentInterpretation || null,
      method: "none",
      orders
    };
  }

  let analysis = null;
  try {
    analysis = await geminiMatches({
      requestedExams,
      labResults,
      extractedText,
      pdfBuffer
    });
  } catch (error) {
    console.error("Exam order Gemini match failed:", error);
  }

  if (!analysis) {
    analysis = {
      interpretationSummary: currentInterpretation || null,
      matches: heuristicMatches(requestedExams, labResults),
      method: "heuristic"
    };
  }

  const { updatedOrders, doneCount } = applyMatchesToOrders(
    orders,
    analysis.matches || [],
    reportId,
    analysis.method
  );

  for (const order of updatedOrders) {
    const { _plan_id, ...row } = order;
    await supabase
      .from("diet_exam_orders")
      .update({ exams: row.exams })
      .eq("id", row.id);
  }

  const summaryParts = [];
  if (analysis.interpretationSummary) summaryParts.push(analysis.interpretationSummary);
  if (doneCount > 0) {
    summaryParts.push(
      `${doneCount} exame(s) do pedido foram identificados neste laudo e marcados como feitos.`
    );
  } else {
    summaryParts.push(
      "Nenhum item do pedido de exames foi identificado com segurança neste laudo. Revise manualmente."
    );
  }

  return {
    doneCount,
    interpretationSummary: summaryParts.join("\n\n"),
    method: analysis.method,
    orders: updatedOrders
  };
}
