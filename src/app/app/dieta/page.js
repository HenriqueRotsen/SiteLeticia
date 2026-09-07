"use client";

import { useEffect, useMemo, useState } from "react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import FatSecretAttribution from "@/components/ui/FatSecretAttribution";
import HelpTooltip from "@/components/ui/HelpTooltip";
import NutritionTotalsSummary from "@/components/ui/NutritionTotalsSummary";
import { formatScaledNutrition, sumNutrition } from "@/lib/foods/nutrition";
import { formatMeasureLabel, restoreMeasureFromStored } from "@/lib/foods/measures";

function planUsesFatSecret(plan) {
  return (plan?.diet_meals || []).some((meal) =>
    (meal.diet_items || []).some((item) => item.source === "fatsecret")
  );
}

function mapMealItems(meal) {
  return (meal.diet_items || []).map((item) => {
    const restored = restoreMeasureFromStored(item.quantity, item.portion_g, item.nutrition_snapshot);

    return {
      ...restored,
      id: item.id,
      label: item.label
    };
  });
}

export default function DietaPage() {
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    fetch("/api/patients/me/diet")
      .then((r) => r.json())
      .then((d) => setPlan(d.dietPlan));
  }, []);

  const planTotals = useMemo(() => {
    if (!plan?.diet_meals) return sumNutrition([]);

    const items = plan.diet_meals.flatMap((meal) => mapMealItems(meal));
    return sumNutrition(items);
  }, [plan]);

  const showAttribution = planUsesFatSecret(plan);

  return (
    <PatientShell title="Dieta" breadcrumbs={["Paciente", "Dieta"]}>
      {!plan ? (
        <Card>
          <p className="text-graphite/70">Sua nutricionista ainda não publicou um plano alimentar.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <h2 className="text-xl font-semibold">{plan.title}</h2>
            {plan.notes ? <p className="mt-2 text-sm text-graphite/70">{plan.notes}</p> : null}
          </Card>
          {(plan.diet_meals || []).map((meal) => {
            const mealItems = mapMealItems(meal);
            const mealTotals = sumNutrition(mealItems);

            return (
              <Card key={meal.id}>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{meal.name}</h3>
                  <HelpTooltip content="Siga as porções indicadas. Em dúvida, fale com a Letícia.">
                    <button type="button" className="rounded-full bg-olive-100 px-2 py-0.5 text-xs text-olive-800">
                      ?
                    </button>
                  </HelpTooltip>
                </div>
                <ul className="space-y-2 text-sm">
                  {mealItems.map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 border-b border-olive-900/5 pb-2">
                      <span>{item.label}</span>
                      <span className="text-right text-graphite/60">
                        {formatMeasureLabel(item.measureUnit, item.measureAmount)}
                        {formatScaledNutrition(item.per100g, item.quantity, item.portionG) ? (
                          <span className="block text-xs">
                            {formatScaledNutrition(item.per100g, item.quantity, item.portionG)}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
                {mealItems.length ? (
                  <NutritionTotalsSummary totals={mealTotals} title="Total da refeição" compact />
                ) : null}
              </Card>
            );
          })}
          {(plan.diet_meals || []).some((meal) => (meal.diet_items || []).length) ? (
            <Card>
              <NutritionTotalsSummary totals={planTotals} title="Total diário do plano" />
            </Card>
          ) : null}
          {showAttribution ? (
            <Card className="bg-linen/40">
              <FatSecretAttribution />
            </Card>
          ) : null}
        </div>
      )}
    </PatientShell>
  );
}
