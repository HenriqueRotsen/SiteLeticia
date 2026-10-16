import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const monthEnd = new Date(todayStart.getFullYear(), todayStart.getMonth() + 1, 0, 23, 59, 59, 999);

  const supabase = auth.ctx.supabase;
  const admin = createSupabaseAdmin();

  const [
    { count: patientsCount },
    { count: todayCount },
    { count: pendingLabsCount },
    { data: upcoming },
    { data: monthPaid },
    { data: pendingAppointments },
    { data: proofDocs }
  ] = await Promise.all([
    supabase.from("patients").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString())
      .eq("status", "scheduled"),
    supabase.from("lab_reports").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase
      .from("appointments")
      .select("*, patients(full_name, phone)")
      .gte("starts_at", new Date().toISOString())
      .eq("status", "scheduled")
      .order("starts_at", { ascending: true })
      .limit(10),
    supabase
      .from("appointments")
      .select("amount_cents")
      .eq("payment_status", "paid")
      .gte("starts_at", monthStart.toISOString())
      .lte("starts_at", monthEnd.toISOString()),
    supabase.from("appointments").select("id").eq("payment_status", "pending"),
    admin
      .from("appointment_documents")
      .select("appointment_id")
      .eq("doc_type", "payment_proof")
  ]);

  const revenueMonthCents = (monthPaid || []).reduce((sum, row) => sum + (row.amount_cents || 0), 0);
  const pendingIds = new Set((pendingAppointments || []).map((row) => row.id));
  const pendingValidation = new Set(
    (proofDocs || []).map((row) => row.appointment_id).filter((id) => pendingIds.has(id))
  ).size;

  return NextResponse.json({
    stats: {
      patients: patientsCount || 0,
      appointmentsToday: todayCount || 0,
      pendingLabs: pendingLabsCount || 0,
      revenueMonthCents,
      pendingPaymentValidation: pendingValidation
    },
    upcoming: upcoming || []
  });
}
