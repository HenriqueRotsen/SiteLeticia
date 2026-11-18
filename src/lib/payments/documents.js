import { randomUUID } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createStorageSignedUrl } from "@/lib/storage/signed-url";
import { compressPdfBuffer } from "@/lib/media/compress-pdf";
import { compressImageBuffer } from "@/lib/media/compress-image";
import {
  ALLOWED_PAYMENT_DOC_TYPES,
  MAX_PAYMENT_DOC_BYTES,
  PAYMENT_AMOUNT_MATCH_TOLERANCE_CENTS
} from "@/lib/constants";
import {
  amountsMatch,
  buildDocumentRowFromExtraction,
  extractPaymentDocument
} from "@/lib/payments/extract-receipt";

export function getPaymentsBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_PAYMENTS || "payment-docs";
}

export function validatePaymentDocFile(file) {
  if (!file || typeof file === "string") {
    return { error: "Arquivo obrigatório." };
  }
  if (!ALLOWED_PAYMENT_DOC_TYPES.includes(file.type)) {
    return { error: "Envie PDF, JPEG, PNG ou WebP." };
  }
  if (file.size > MAX_PAYMENT_DOC_BYTES) {
    return { error: "Arquivo muito grande (máx. 10MB)." };
  }
  return { error: null };
}

export async function patientHasValidatedPayment(supabase, patientId) {
  const { count } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .in("payment_status", ["paid", "waived"]);

  return (count || 0) > 0;
}

async function prepareStoredBuffer(originalBuffer, mimeType) {
  if (mimeType === "application/pdf") {
    try {
      const compressed = await compressPdfBuffer(originalBuffer);
      return { buffer: compressed.buffer, contentType: "application/pdf" };
    } catch {
      return { buffer: originalBuffer, contentType: mimeType };
    }
  }

  if (String(mimeType).startsWith("image/")) {
    try {
      const compressed = await compressImageBuffer(originalBuffer, mimeType);
      return {
        buffer: compressed.buffer,
        contentType: compressed.contentType || mimeType
      };
    } catch {
      return { buffer: originalBuffer, contentType: mimeType };
    }
  }

  return { buffer: originalBuffer, contentType: mimeType };
}

function extensionForMime(mimeType) {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export async function listAppointmentDocuments(appointmentId, { withUrls = true } = {}) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("appointment_documents")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: false });

  if (error) return { documents: [], error };

  const bucket = getPaymentsBucket();
  const documents = withUrls
    ? await Promise.all(
        (data || []).map(async (doc) => ({
          ...doc,
          url: await createStorageSignedUrl(bucket, doc.storage_path)
        }))
      )
    : data || [];

  return { documents, error: null };
}

export async function uploadAppointmentDocument({
  appointmentId,
  patientId,
  file,
  docType,
  uploadedByRole,
  expectedAmountCents,
  proofAmountCents = null
}) {
  const fileCheck = validatePaymentDocFile(file);
  if (fileCheck.error) {
    return { error: fileCheck.error, status: 400 };
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  let extraction;
  try {
    extraction = await extractPaymentDocument(originalBuffer, file.type);
  } catch {
    extraction = {
      amountCents: null,
      paidAt: null,
      payerName: null,
      confidence: 0,
      method: "failed",
      rawText: ""
    };
  }

  const rowFields = buildDocumentRowFromExtraction(extraction, expectedAmountCents);

  if (docType === "invoice" && proofAmountCents != null && rowFields.extracted_amount_cents != null) {
    const matchesExpected = amountsMatch(rowFields.extracted_amount_cents, expectedAmountCents);
    const matchesProof = amountsMatch(rowFields.extracted_amount_cents, proofAmountCents);
    rowFields.amount_matches =
      matchesExpected === true && (matchesProof === true || matchesProof === null);
    rowFields.extraction_json = {
      ...rowFields.extraction_json,
      matchesExpected,
      matchesProof,
      toleranceCents: PAYMENT_AMOUNT_MATCH_TOLERANCE_CENTS
    };
  }

  const { buffer: storedBuffer, contentType } = await prepareStoredBuffer(originalBuffer, file.type);
  const ext = extensionForMime(contentType);
  const path = `${patientId}/${appointmentId}/${docType}-${randomUUID()}.${ext}`;
  const bucket = getPaymentsBucket();
  const supabase = createSupabaseAdmin();

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, storedBuffer, {
    contentType
  });

  if (uploadError) {
    return { error: "Falha no upload.", status: 500 };
  }

  const { data: document, error } = await supabase
    .from("appointment_documents")
    .insert({
      appointment_id: appointmentId,
      patient_id: patientId,
      doc_type: docType,
      storage_path: path,
      mime_type: contentType,
      file_name: file.name || null,
      uploaded_by_role: uploadedByRole,
      ...rowFields,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    return { error: "Erro ao salvar documento.", status: 500 };
  }

  const url = await createStorageSignedUrl(bucket, path);
  return { document: { ...document, url }, error: null };
}

export function summarizeDocuments(documents = []) {
  const proofs = documents.filter((d) => d.doc_type === "payment_proof");
  const invoices = documents.filter((d) => d.doc_type === "invoice");
  return {
    latestProof: proofs[0] || null,
    latestInvoice: invoices[0] || null,
    hasProof: proofs.length > 0,
    hasInvoice: invoices.length > 0,
    hasMismatch: documents.some((d) => d.amount_matches === false)
  };
}

// Remove um anexo da consulta (registro + arquivo). `onlyTypes` limita o que pode ser removido.
export async function deleteAppointmentDocument(appointmentId, documentId, { onlyTypes = null } = {}) {
  const supabase = createSupabaseAdmin();
  const { data: doc } = await supabase
    .from("appointment_documents")
    .select("id, doc_type, storage_path")
    .eq("id", documentId)
    .eq("appointment_id", appointmentId)
    .maybeSingle();
  if (!doc) return { error: "Anexo não encontrado.", status: 404 };
  if (onlyTypes && !onlyTypes.includes(doc.doc_type)) {
    return { error: "Você não pode remover este anexo.", status: 403 };
  }

  const { error } = await supabase.from("appointment_documents").delete().eq("id", doc.id);
  if (error) return { error: "Não foi possível remover o anexo.", status: 500 };

  if (doc.storage_path) {
    try {
      await supabase.storage.from(getPaymentsBucket()).remove([doc.storage_path]);
    } catch (err) {
      console.error("Payment doc storage remove failed:", err?.message || err);
    }
  }
  return { error: null, document: doc };
}
