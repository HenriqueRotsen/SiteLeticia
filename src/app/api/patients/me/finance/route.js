import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createStorageSignedUrl } from "@/lib/storage/signed-url";
import { getPaymentsBucket, summarizeDocuments } from "@/lib/payments/documents";

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const patientId = auth.ctx.patient.id;
  const supabase = createSupabaseAdmin();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", patientId)
    .order("starts_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: "Erro ao carregar financeiro." }, { status: 500 });
  }

  const ids = (appointments || []).map((a) => a.id);
  let documents = [];
  if (ids.length) {
    const { data: docs } = await supabase
      .from("appointment_documents")
      .select("*")
      .eq("patient_id", patientId)
      .in("appointment_id", ids)
      .order("created_at", { ascending: false });
    documents = docs || [];
  }

  const bucket = getPaymentsBucket();
  const docsByAppt = {};
  for (const doc of documents) {
    if (!docsByAppt[doc.appointment_id]) docsByAppt[doc.appointment_id] = [];
    docsByAppt[doc.appointment_id].push(doc);
  }

  const rows = await Promise.all(
    (appointments || []).map(async (appt) => {
      const apptDocs = docsByAppt[appt.id] || [];
      const withUrls = await Promise.all(
        apptDocs.map(async (doc) => ({
          ...doc,
          url: await createStorageSignedUrl(bucket, doc.storage_path)
        }))
      );
      return {
        ...appt,
        documents: withUrls,
        summary: summarizeDocuments(withUrls)
      };
    })
  );

  const paid = rows.filter((r) => r.payment_status === "paid");
  const expensesCents = paid.reduce((sum, r) => sum + (r.amount_cents || 0), 0);

  return NextResponse.json({
    summary: {
      expensesCents,
      paidCount: paid.length,
      pendingCount: rows.filter((r) => r.payment_status === "pending").length
    },
    appointments: rows
  });
}
