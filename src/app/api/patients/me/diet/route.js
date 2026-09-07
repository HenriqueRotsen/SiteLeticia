import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { data: plans } = await auth.ctx.supabase
    .from("diet_plans")
    .select("*, diet_meals(*, diet_items(*)), diet_supplements(*), diet_referrals(*)")
    .eq("patient_id", auth.ctx.patient.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  return NextResponse.json({ dietPlan: plans?.[0] || null });
}
