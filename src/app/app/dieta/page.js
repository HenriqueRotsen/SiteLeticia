"use client";

import { useEffect, useMemo, useState } from "react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import FatSecretAttribution from "@/components/ui/FatSecretAttribution";
import FatSecretNutrientGrid from "@/components/ui/FatSecretNutrientGrid";
import HelpTooltip from "@/components/ui/HelpTooltip";
import {
  formatScaledNutrition,
  scaleNutrition,
  sumNutrition,
  totalPortionGrams
} from "@/lib/foods/nutrition";
import { formatMeasureLabel, restoreMeasureFromStored } from "@/lib/foods/measures";

function planUsesFatSecret(plan) {
  return (plan?.diet_meals || []).some((meal) =>
    (meal.diet_items || []).some(
      (item) =>
        item.source === "fatsecret" ||
        item.source === "fatsecret_csv" ||
        item.source === "fatsecret_pdf"
    )
  );
}

function mapMealItems(meal) {
  return (meal.diet_items || []).map((item) => {
    const restored = restoreMeasureFromStored(item.quantity, item.portion_g, item.nutrition_snapshot);

    return {
      ...restored,
      id: item.id,
      label: item.label,
      per100g: restored.per100g
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
              <Card key={meal.id} title={meal.name}>
                <ul className="space-y-3">
                  {mealItems.map((item) => {
                    const itemTotals =
                      scaleNutrition(item.per100g, totalPortionGrams(item.quantity, item.portionG)) ||
                      {};
                    const scaled = formatScaledNutrition(item.per100g, item.quantity, item.portionG);

                    return (
                      <li
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-olive-900/8 bg-white/70"
                      >
                        <div className="border-b border-olive-900/6 px-3 py-3">
                          <p className="font-medium text-graphite">{item.label}</p>
                          <p className="mt-0.5 text-xs text-graphite/50">
                            {formatMeasureLabel(
                              item.measureUnit,
                              item.measureAmount,
                              item.gramsPerUnit
                            )}
                            {scaled ? ` · ${scaled.split(" · ")[0]}` : ""}
                          </p>
                        </div>
                        <div className="bg-linen/25 px-3 py-2.5">
                          <FatSecretNutrientGrid
                            totals={itemTotals}
                            title="Nutrientes do alimento"
                            size="micro"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {mealItems.length ? (
                  <div className="mt-4 rounded-2xl border border-olive-900/10 bg-gradient-to-br from-linen/80 to-olive-50/40 px-4 py-4">
                    <div className="mb-3 flex items-center gap-2">
                      <p className="text-sm font-semibold text-graphite">Total da refeição</p>
                      <HelpTooltip content="Siga as porções indicadas. Em dúvida, fale com a Letícia.">
                        <button
                          type="button"
                          className="rounded-full bg-olive-100 px-2 py-0.5 text-xs text-olive-800"
                        >
                          ?
                        </button>
                      </HelpTooltip>
                    </div>
                    <FatSecretNutrientGrid totals={mealTotals} title={null} compact />
                  </div>
                ) : null}
              </Card>
            );
          })}

          {(plan.diet_meals || []).some((meal) => (meal.diet_items || []).length) ? (
            <Card>
              <div className="mb-1 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-graphite">Total do plano</h3>
                </div>
              </div>
              <FatSecretNutrientGrid totals={planTotals} title={null} />
            </Card>
          ) : null}

          {(plan.diet_supplements || []).length ? (
            <Card title="Suplementação">
              <ul className="space-y-3">
                {[...(plan.diet_supplements || [])]
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-olive-900/8 bg-white/70 px-4 py-3"
                    >
                      <p className="font-semibold text-graphite">{item.product_name}</p>
                      <p className="mt-1 text-sm text-graphite/60">
                        {item.dosage}
                        {item.posology ? ` · ${item.posology}` : ""}
                      </p>
                      {item.notes ? (
                        <p className="mt-1 text-xs text-graphite/50">{item.notes}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            </Card>
          ) : null}

          {(plan.diet_referrals || []).length ? (
            <Card title="Encaminhamentos">
              <ul className="space-y-3">
                {[...(plan.diet_referrals || [])]
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((item) => (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-olive-900/8 bg-white/70 px-4 py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-graphite">{item.specialty}</p>
                        {item.urgency === "priority" ? (
                          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-900">
                            Prioritário
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-graphite/60">{item.reason}</p>
                      {item.professional_name ? (
                        <p className="mt-1 text-xs text-graphite/50">{item.professional_name}</p>
                      ) : null}
                      {item.notes ? (
                        <p className="mt-1 text-xs text-graphite/50">{item.notes}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
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
