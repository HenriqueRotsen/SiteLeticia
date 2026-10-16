import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createStorageSignedUrl } from "@/lib/storage/signed-url";
import { getPaymentsBucket, summarizeDocuments } from "@/lib/payments/documents";

function monthBounds(yearMonth) {
  const match = String(yearMonth || "").match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  const year = match ? Number(match[1]) : now.getFullYear();
  const month = match ? Number(match[2]) - 1 : now.getMonth();
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end, year, month: month + 1 };
}

export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const { start, end, year, month } = monthBounds(url.searchParams.get("month"));
  const supabase = createSupabaseAdmin();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*, patients(full_name, phone)")
    .gte("starts_at", start.toISOString())
    .lte("starts_at", end.toISOString())
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
      const summary = summarizeDocuments(withUrls);
      return {
        ...appt,
        documents: withUrls,
        summary
      };
    })
  );

  const paid = rows.filter((r) => r.payment_status === "paid" || r.payment_status === "waived");
  const pendingValidation = rows.filter(
    (r) => r.payment_status === "pending" && r.summary.hasProof
  );
  const awaitingProof = rows.filter(
    (r) => r.payment_status === "pending" && !r.summary.hasProof
  );
  const mismatches = rows.filter((r) => r.summary.hasMismatch);

  const revenueCents = paid
    .filter((r) => r.payment_status === "paid")
    .reduce((sum, r) => sum + (r.amount_cents || 0), 0);

  return NextResponse.json({
    period: { year, month, start: start.toISOString(), end: end.toISOString() },
    summary: {
      revenueCents,
      paidCount: paid.filter((r) => r.payment_status === "paid").length,
      waivedCount: paid.filter((r) => r.payment_status === "waived").length,
      pendingValidationCount: pendingValidation.length,
      awaitingProofCount: awaitingProof.length,
      mismatchCount: mismatches.length
    },
    appointments: rows,
    pendingValidation,
    mismatches
  });
}
