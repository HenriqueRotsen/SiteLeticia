import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractLabReportFromPdfBuffer } from "@/lib/labs/extract";
import { fulfillExamOrdersFromLabReport } from "@/lib/labs/fulfill-orders";

function labsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_LABS || "lab-reports";
}

/**
 * Baixa o PDF do Storage, roda Gemini/regex e marca itens do pedido.
 */
export async function analyzeStoredLabReport({ patientId, reportId }) {
  const supabase = createSupabaseAdmin();

  const { data: report, error } = await supabase
    .from("lab_reports")
    .select("id, patient_id, storage_path, status")
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (error || !report?.storage_path) {
    throw new Error("Laudo não encontrado.");
  }

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

  const fulfillment = await fulfillExamOrdersFromLabReport({
    patientId,
    reportId,
    labResults: extraction.results || [],
    extractedText: extraction.extractedText || "",
    pdfBuffer,
    currentInterpretation: extraction.interpretationSummary || ""
  });

  const summary =
    fulfillment.interpretationSummary ||
    extraction.interpretationSummary ||
    "Análise concluída. Revise o laudo manualmente se necessário.";

  const { data: updated, error: updateError } = await supabase
    .from("lab_reports")
    .update({
      extracted_text: extraction.extractedText || "",
      ai_interpretation: summary,
      interpretation_summary: summary
    })
    .eq("id", reportId)
    .select("*")
    .single();

  if (updateError) {
    throw new Error("Erro ao salvar a análise.");
  }

  return {
    report: updated,
    results: extraction.results || [],
    fulfillment: {
      doneCount: fulfillment.doneCount,
      method: fulfillment.method
    }
  };
}
