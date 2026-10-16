"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import Badge from "@/components/ui/Badge";
import FatSecretNutrientGrid from "@/components/ui/FatSecretNutrientGrid";
import HelpTooltip from "@/components/ui/HelpTooltip";
import PrescriptionPrintButton, {
  buildDietPrintHtml,
  buildExamOrdersPrintHtml,
  buildReferralsPrintHtml,
  buildSupplementsPrintHtml
} from "@/components/ui/PrescriptionPrintButton";
import {
  formatScaledNutrition,
  scaleNutrition,
  sumNutrition,
  totalPortionGrams
} from "@/lib/foods/nutrition";
import { formatMeasureLabel, restoreMeasureFromStored } from "@/lib/foods/measures";
import { groupSupplementRows } from "@/lib/diets/supplements";
import { labelDietStatus } from "@/lib/labels";

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

function formatPlanDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function apiPlanToDietPrint(plan) {
  const meals = [...(plan?.diet_meals || [])]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((meal) => ({
      name: meal.name,
      items: (meal.diet_items || []).map((item) => ({
        label: item.label,
        portionG: item.portion_g,
        measureUnit: item.nutrition_snapshot?.measureUnit,
        measureAmount: item.nutrition_snapshot?.measureAmount ?? item.quantity,
        nutritionSnapshot: item.nutrition_snapshot
      }))
    }));
  return { meals };
}

function apiReferralsToPrint(referrals = []) {
  return [...referrals]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((item) => ({
      specialty: item.specialty,
      reason: item.reason,
      bodyText: item.body_text,
      professionalName: item.professional_name,
      urgency: item.urgency,
      notes: item.notes
    }));
}

function apiExamOrdersToPrint(orders = []) {
  return [...orders]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((order) => ({
      title: order.title,
      exams: order.exams || [],
      collectionNotes: order.collection_notes || [],
      observations: order.observations,
      meta: order.meta || {}
    }));
}

export default function DietaPage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [paymentGate, setPaymentGate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patients/me/diet")
      .then((r) => r.json())
      .then((d) => {
        const nextPlans = d.dietPlans?.length
          ? d.dietPlans
          : d.dietPlan
            ? [d.dietPlan]
            : [];
        setPlans(nextPlans);
        setSelectedPlanId(d.dietPlan?.id || nextPlans[0]?.id || null);
        setPatientName(d.patientName || "");
        setPaymentGate(d.paymentGate || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const plan = useMemo(
    () => plans.find((item) => item.id === selectedPlanId) || plans[0] || null,
    [plans, selectedPlanId]
  );

  const planTotals = useMemo(() => {
    if (!plan?.diet_meals) return sumNutrition([]);
    const items = plan.diet_meals.flatMap((meal) => mapMealItems(meal));
    return sumNutrition(items);
  }, [plan]);

  const supplementEntries = useMemo(
    () => groupSupplementRows(plan?.diet_supplements || []),
    [plan]
  );

  const hasMeals = (plan?.diet_meals || []).some((meal) => (meal.diet_items || []).length);
  const hasSupplements = (plan?.diet_supplements || []).length > 0;
  const hasReferrals = (plan?.diet_referrals || []).length > 0;
  const hasExams = (plan?.diet_exam_orders || []).length > 0;
  const showPlanSwitcher = plans.length > 1;

  return (
    <PatientShell title="Dieta" breadcrumbs={["Paciente", "Dieta"]}>
      {loading ? (
        <Card>
          <p className="text-graphite/70">Carregando plano...</p>
        </Card>
      ) : paymentGate?.locked ? (
        <Card>
          <h2 className="text-lg font-semibold text-graphite">Prescrição aguardando pagamento</h2>
          <p className="mt-2 text-sm text-graphite/70">
            {paymentGate.reason ||
              "Envie o comprovante na página de consultas e aguarde a validação da nutricionista."}
          </p>
          <Link
            href="/app/consultas"
            className="mt-4 inline-flex rounded-xl bg-olive-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Ir para minhas consultas
          </Link>
        </Card>
      ) : !plan ? (
        <Card>
          <p className="text-graphite/70">Sua nutricionista ainda não publicou um plano alimentar.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {showPlanSwitcher ? (
            <Card>
              <p className="text-sm font-semibold text-graphite">Seus planos</p>
              <p className="mt-1 text-xs text-graphite/50">
                Inclui o plano atual e os anteriores desativados.
              </p>
              <ul className="mt-3 space-y-2">
                {plans.map((item) => {
                  const isSelected = item.id === plan.id;
                  const isActive = item.status === "active";
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanId(item.id)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-olive-300 bg-olive-50/60 ring-1 ring-olive-200/70"
                            : "border-olive-900/8 bg-white hover:border-olive-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-graphite">
                            {item.title || "Plano alimentar"}
                          </p>
                          <p className="mt-0.5 text-xs text-graphite/45">
                            {formatPlanDate(item.created_at)}
                            {isActive ? " · plano atual" : " · desativado"}
                          </p>
                        </div>
                        <Badge variant={isActive ? "success" : "neutral"}>
                          {labelDietStatus(item.status)}
                        </Badge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{plan.title}</h2>
                  <Badge variant={plan.status === "active" ? "success" : "neutral"}>
                    {labelDietStatus(plan.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-graphite/45">{formatPlanDate(plan.created_at)}</p>
                {plan.notes ? <p className="mt-2 text-sm text-graphite/70">{plan.notes}</p> : null}
              </div>
            </div>

            {(hasMeals || hasSupplements || hasReferrals || hasExams) ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-olive-900/8 pt-4">
                {hasMeals ? (
                  <PrescriptionPrintButton
                    label="Imprimir dieta"
                    title={plan.title || "Plano alimentar"}
                    subtitle="Prescrição dietética"
                    patientName={patientName}
                    bodyHtml={buildDietPrintHtml(apiPlanToDietPrint(plan))}
                  />
                ) : null}
                {hasSupplements ? (
                  <PrescriptionPrintButton
                    label="Imprimir suplementação"
                    title="Prescrição de suplementação"
                    patientName={patientName}
                    bodyHtml={buildSupplementsPrintHtml(supplementEntries)}
                  />
                ) : null}
                {hasReferrals ? (
                  <PrescriptionPrintButton
                    label="Imprimir encaminhamentos"
                    title="Encaminhamentos"
                    patientName={patientName}
                    bodyHtml={buildReferralsPrintHtml(apiReferralsToPrint(plan.diet_referrals))}
                  />
                ) : null}
                {hasExams ? (
                  <PrescriptionPrintButton
                    label="Imprimir exames"
                    title="Pedido de exames"
                    patientName={patientName}
                    bodyHtml={buildExamOrdersPrintHtml(apiExamOrdersToPrint(plan.diet_exam_orders))}
                  />
                ) : null}
              </div>
            ) : null}
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

          {hasMeals ? (
            <Card>
              <div className="mb-1 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-graphite">Total do plano</h3>
                </div>
              </div>
              <FatSecretNutrientGrid totals={planTotals} title={null} />
            </Card>
          ) : null}

          {hasSupplements ? (
            <Card title="Suplementação">
              <div className="space-y-4">
                {supplementEntries.map((entry) =>
                  entry.kind === "group" ? (
                    <div
                      key={entry.clientId}
                      className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white/90"
                    >
                      <div className="flex items-center gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-2.5">
                        <span className="h-2.5 w-2.5 rounded-[2px] bg-violet-700" />
                        <p className="font-semibold text-violet-950">{entry.title}</p>
                      </div>
                      <ul>
                        {(entry.items || []).map((item, index) => (
                          <li
                            key={item.clientId}
                            className={`flex items-baseline justify-between gap-3 px-4 py-2 text-sm ${
                              index % 2 === 0 ? "bg-violet-50/45" : "bg-white"
                            }`}
                          >
                            <span>
                              <span className="mr-1.5 text-violet-400">•</span>
                              {item.productName}
                            </span>
                            <span className="shrink-0 tabular-nums font-medium text-violet-800">
                              {item.dosage}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {entry.posology ? (
                        <p className="border-t border-violet-100 px-4 py-2.5 text-sm text-violet-950">
                          <span className="font-semibold">Posologia:</span> {entry.posology}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div
                      key={entry.clientId}
                      className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white/90"
                    >
                      <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-2.5">
                        <p className="font-semibold text-violet-950">{entry.productName}</p>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium text-violet-800">{entry.dosage}</p>
                        {entry.posology ? (
                          <p className="mt-1 text-sm text-graphite/60">{entry.posology}</p>
                        ) : null}
                        {entry.notes ? (
                          <p className="mt-1 text-xs text-graphite/50">{entry.notes}</p>
                        ) : null}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Card>
          ) : null}

          {hasReferrals ? (
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
                      {item.body_text ? (
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-graphite/55">
                          {item.body_text}
                        </p>
                      ) : null}
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

          {hasExams ? (
            <Card title="Pedidos de exame">
              <div className="space-y-4">
                {[...(plan.diet_exam_orders || [])]
                  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
                  .map((order) => (
                    <div key={order.id} className="rounded-2xl border border-olive-900/8 bg-white/70 px-4 py-3">
                      <p className="font-semibold text-graphite">{order.title}</p>
                      <ul className="mt-2 space-y-1 text-sm text-graphite/65">
                        {(order.exams || []).map((exam, index) => (
                          <li key={`${order.id}-${index}`}>
                            • {exam.name}
                            {exam.category === "complementary" && exam.whenToRequest ? (
                              <span className="block pl-3 text-xs text-graphite/45">
                                {exam.whenToRequest}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      {(order.collection_notes || []).length ? (
                        <div className="mt-3 border-t border-olive-900/5 pt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-graphite/40">
                            Coleta
                          </p>
                          <ul className="mt-1 space-y-1 text-xs text-graphite/55">
                            {order.collection_notes.map((note, index) => (
                              <li key={`${order.id}-c-${index}`}>• {note}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ))}
              </div>
            </Card>
          ) : null}
        </div>
      )}
    </PatientShell>
  );
}
