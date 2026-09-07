import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { refreshComputedInsights } from "@/lib/insights/compute";

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  await refreshComputedInsights(auth.ctx.patient.id);

  const { data } = await auth.ctx.supabase
    .from("patient_insights")
    .select("*")
    .eq("patient_id", auth.ctx.patient.id)
    .eq("visible_to_patient", true)
    .order("computed_at", { ascending: false });

  return NextResponse.json({ insights: data || [] });
}
