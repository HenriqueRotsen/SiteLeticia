import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { dietPlanSchema } from "@/lib/validation/schemas";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function GET(_request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("diet_plans")
    .select("*, diet_meals(*, diet_items(*))")
    .eq("patient_id", params.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ dietPlans: data || [] });
}

export async function POST(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = dietPlanSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Plano inválido." }, { status: 400 });
  }

  const { data: plan, error } = await auth.ctx.supabase
    .from("diet_plans")
    .insert({
      patient_id: params.id,
      title: body.title,
      notes: body.notes,
      status: body.status
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao salvar plano." }, { status: 500 });

  for (const meal of body.meals) {
    const { data: mealRow } = await auth.ctx.supabase
      .from("diet_meals")
      .insert({ diet_plan_id: plan.id, name: meal.name, sort_order: meal.sortOrder })
      .select("*")
      .single();

    if (meal.items?.length) {
      await auth.ctx.supabase.from("diet_items").insert(
        meal.items.map((item) => ({
          meal_id: mealRow.id,
          source: item.source,
          external_id: item.externalId,
          label: item.label,
          quantity: item.quantity,
          portion_g: item.portionG,
          nutrition_snapshot: item.nutritionSnapshot || null
        }))
      );
    }
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "diet_plan_create",
    resourceType: "patient",
    resourceId: params.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true, planId: plan.id });
}
