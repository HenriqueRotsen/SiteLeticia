import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractLabReportFromPdfBuffer } from "@/lib/labs/extract";
import { fulfillExamOrdersFromLabReport } from "@/lib/labs/fulfill-orders";
import {
  resolveConsultationReferenceDate,
  validateLabReportIdentityAndTiming
} from "@/lib/labs/validate-report";

function labsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_LABS || "lab-reports";
}

async function safeUpdateReport(supabase, reportId, patch) {
  const withMeta = await supabase.from("lab_reports").update(patch).eq("id", reportId).select("*").single();
  if (!withMeta.error) return withMeta;

  // Ambiente sem coluna meta ainda
  if (String(withMeta.error.message || "").includes("meta")) {
    const { meta, ...rest } = patch;
    return supabase.from("lab_reports").update(rest).eq("id", reportId).select("*").single();
  }

  return withMeta;
}

async function deleteReportCompletely(supabase, report) {
  await supabase.from("lab_results").delete().eq("report_id", report.id);
  await supabase.from("lab_reports").delete().eq("id", report.id);
  if (report.storage_path) {
    await supabase.storage.from(labsBucket()).remove([report.storage_path]);
  }
}

/**
 * Baixa o PDF do Storage, valida identidade/data, roda extração e (se elegível) marca itens do pedido.
 */
export async function analyzeStoredLabReport({
  patientId,
  reportId,
  declaredTiming = null,
  skipFulfillment = false
} = {}) {
  const supabase = createSupabaseAdmin();

  const { data: report, error } = await supabase
    .from("lab_reports")
    .select("*")
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error || !report?.storage_path) {
    throw new Error("Laudo não encontrado.");
  }

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("id", patientId)
    .maybeSingle();

  const { data: file, error: downloadError } = await supabase.storage
    .from(labsBucket())
    .download(report.storage_path);

  if (downloadError || !file) {
    throw new Error("Não foi possível ler o PDF para análise.");
  }

  const pdfBuffer = Buffer.from(await file.arrayBuffer());

  let extraction;
  try {
    extraction = await extractLabReportFromPdfBuffer(pdfBuffer);
  } catch {
    extraction = {
      extractedText: "",
      results: [],
      interpretationSummary: "Não foi possível extrair automaticamente. Revise o PDF manualmente."
    };
  }

  const { consultationAt, source: consultationSource } = await resolveConsultationReferenceDate(
    supabase,
    patientId
  );

  const timingFromMeta = report.meta?.declared_timing || declaredTiming || null;

  const validation = await validateLabReportIdentityAndTiming({
    pdfBuffer,
    extractedText: extraction.extractedText || "",
    expectedPatientName: patient?.full_name || "",
    consultationAt,
    declaredTiming: timingFromMeta
  });

  if (!validation.ok && validation.code === "wrong_patient") {
    await deleteReportCompletely(supabase, report);
    const err = new Error(validation.message);
    err.code = "wrong_patient";
    err.validation = validation;
    throw err;
  }

  await supabase.from("lab_results").delete().eq("report_id", reportId);

  if (extraction.results?.length) {
    await supabase.from("lab_results").insert(
      extraction.results.map((r) => ({
        report_id: reportId,
        marker_key: r.marker_key,
        marker_name: r.marker_name,
        value: r.value,
        value_text: r.value_text,
        unit: r.unit,
        ref_min: r.ref_min,
        ref_max: r.ref_max,
        flag: r.flag
      }))
    );
  }

  const canFulfill = validation.usableForOrders && !skipFulfillment;
  let fulfillment = { doneCount: 0, method: "skipped" };

  if (canFulfill) {
    fulfillment = await fulfillExamOrdersFromLabReport({
      patientId,
      reportId,
      labResults: extraction.results || [],
      extractedText: extraction.extractedText || "",
      pdfBuffer,
      currentInterpretation: extraction.interpretationSummary || ""
    });
  }

  const summaryParts = [];
  if (validation.code === "before_consultation") {
    summaryParts.push(
      "Laudo anterior à consulta: arquivado sem preencher os exames solicitados."
    );
  }
  if (validation.detectedPatientName) {
    summaryParts.push(`Paciente no laudo: ${validation.detectedPatientName}.`);
  }
  if (validation.reportDate) {
    summaryParts.push(`Data do laudo: ${validation.reportDate}.`);
  }
  if (fulfillment.interpretationSummary) {
    summaryParts.push(fulfillment.interpretationSummary);
  } else if (extraction.interpretationSummary) {
    summaryParts.push(extraction.interpretationSummary);
  } else {
    summaryParts.push("Análise concluída. Revise o laudo manualmente se necessário.");
  }

  const summary = summaryParts.join("\n\n");
  const meta = {
    ...(report.meta || {}),
    declared_timing: timingFromMeta,
    validation_code: validation.code,
    matches_patient: validation.matchesPatient,
    timing: validation.timing,
    report_date: validation.reportDate,
    detected_patient_name: validation.detectedPatientName,
    usable_for_orders: validation.usableForOrders,
    consultation_source: consultationSource,
    consultation_at: consultationAt ? consultationAt.toISOString() : null,
    analyzed_at: new Date().toISOString()
  };

  const { data: updated, error: updateError } = await safeUpdateReport(supabase, reportId, {
    extracted_text: extraction.extractedText || "",
    ai_interpretation: summary,
    interpretation_summary: summary,
    meta
  });

  if (updateError) {
    throw new Error("Erro ao salvar a análise.");
  }

  return {
    report: updated,
    results: extraction.results || [],
    validation,
    fulfillment: {
      doneCount: fulfillment.doneCount || 0,
      method: fulfillment.method || (canFulfill ? "auto" : "skipped")
    }
  };
}
