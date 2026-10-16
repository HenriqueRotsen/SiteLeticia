import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { analyzeStoredLabReport } from "@/lib/labs/analyze-report";

export const maxDuration = 60;

async function loadPatientExamOrders(supabase, patientId) {
  const { data: plans } = await supabase
    .from("diet_plans")
    .select("id, status, title, diet_exam_orders(*)")
    .eq("patient_id", patientId)
    .in("status", ["active", "archived"])
    .order("created_at", { ascending: false });

  const active = (plans || []).find((plan) => plan.status === "active") || (plans || [])[0] || null;
  return (active?.diet_exam_orders || [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function POST(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  let reportId = "";
  try {
    const body = await request.json();
    reportId = body.reportId || "";
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  if (!reportId) {
    return NextResponse.json({ message: "Laudo obrigatório." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const patientId = auth.ctx.patient.id;

  const { data: existing } = await supabase
    .from("lab_reports")
    .select("id, uploaded_by, status")
    .eq("id", reportId)
    .eq("patient_id", patientId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ message: "Laudo não encontrado." }, { status: 404 });
  }

  if (existing.uploaded_by !== "patient") {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const result = await analyzeStoredLabReport({ patientId, reportId });
    const examOrders = await loadPatientExamOrders(supabase, patientId);
    return NextResponse.json({
      report: {
        id: result.report.id,
        status: result.report.status,
        created_at: result.report.created_at,
        uploaded_by: result.report.uploaded_by,
        file_url: `/api/patients/me/labs/file?id=${encodeURIComponent(result.report.id)}`
      },
      examOrders,
      fulfillment: result.fulfillment
    });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Falha na análise automática." },
      { status: 500 }
    );
  }
}
