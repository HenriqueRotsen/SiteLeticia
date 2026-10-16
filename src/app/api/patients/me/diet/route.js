import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { patientHasValidatedPayment } from "@/lib/payments/documents";

function sortDietPlans(plans = []) {
  return [...plans].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (b.status === "active" && a.status !== "active") return 1;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });
}

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const unlocked = await patientHasValidatedPayment(auth.ctx.supabase, auth.ctx.patient.id);

  if (!unlocked) {
    return NextResponse.json({
      dietPlan: null,
      dietPlans: [],
      patientName: auth.ctx.patient.full_name || auth.ctx.profile?.full_name || "",
      paymentGate: {
        locked: true,
        reason:
          "Sua prescrição será liberada após o envio do comprovante de pagamento e a validação pela nutricionista."
      }
    });
  }

  const { data: plans } = await auth.ctx.supabase
    .from("diet_plans")
    .select(
      "*, diet_meals(*, diet_items(*)), diet_supplements(*), diet_referrals(*), diet_exam_orders(*)"
    )
    .eq("patient_id", auth.ctx.patient.id)
    .in("status", ["active", "archived"])
    .order("created_at", { ascending: false });

  const dietPlans = sortDietPlans(plans || []);
  const dietPlan = dietPlans.find((plan) => plan.status === "active") || null;

  return NextResponse.json({
    dietPlan,
    dietPlans,
    patientName: auth.ctx.patient.full_name || auth.ctx.profile?.full_name || "",
    paymentGate: { locked: false }
  });
}
