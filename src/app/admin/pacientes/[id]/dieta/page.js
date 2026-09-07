"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileUp,
  RefreshCw,
  Save,
  UserRound
} from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import BmrPanel from "@/components/ui/BmrPanel";
import DietNutrientAnalysis from "@/components/ui/DietNutrientAnalysis";
import CsvUploadZone from "@/components/ui/CsvUploadZone";
import MealDietAccordion from "@/components/ui/MealDietAccordion";
import Modal from "@/components/ui/Modal";
import PlanWizardStepper from "@/components/ui/PlanWizardStepper";
import ReferralList from "@/components/ui/ReferralList";
import SupplementPrescriptionList from "@/components/ui/SupplementPrescriptionList";
import { computePatientMetabolism } from "@/lib/metabolism/bmr";
import { sanitizePer100g, sumNutrition, FATSECRET_REPORT_KEYS } from "@/lib/foods/nutrition";
import {
  buildNutritionSnapshot,
  restoreMeasureFromStored,
  toStoredPortion
} from "@/lib/foods/measures";

function formatPlanDate(date = new Date()) {
  return date.toLocaleDateString("pt-BR");
}

function defaultPlanTitle(patientName, date = new Date()) {
  const name = patientName?.trim() || "Paciente";
  return `Plano Alimentar - ${name} - ${formatPlanDate(date)}`;
}

function emptyDraft(patientName) {
  return {
    title: defaultPlanTitle(patientName),
    notes: "",
    status: "active",
    source: "fatsecret_csv",
    sourcePdfPath: null,
    extractionSummary: null,
    extractionMethod: null,
    meals: [],
    supplements: [],
    referrals: []
  };
}

function mapSupplements(plan) {
  return (plan.diet_supplements || plan.supplements || []).map((item, index) => ({
    clientId: item.id || crypto.randomUUID(),
    productName: item.product_name || item.productName || "",
    dosage: item.dosage || "",
    posology: item.posology || "",
    notes: item.notes || "",
    sortOrder: item.sort_order ?? item.sortOrder ?? index
  }));
}

function mapReferrals(plan) {
  return (plan.diet_referrals || plan.referrals || []).map((item, index) => ({
    clientId: item.id || crypto.randomUUID(),
    specialty: item.specialty || "",
    professionalName: item.professional_name || item.professionalName || "",
    reason: item.reason || "",
    urgency: item.urgency || "routine",
    notes: item.notes || "",
    sortOrder: item.sort_order ?? item.sortOrder ?? index
  }));
}

function rebuildItemSnapshot(item, patch = {}) {
  const next = { ...item, ...patch };
  const measureUnit = next.measureUnit || "gramas";
  const measureAmount = Number(next.measureAmount ?? next.portionG) || 100;
  const isAbsoluteMeasure = ["gramas", "ml", "litros"].includes(measureUnit);
  const gramsPerUnit = !isAbsoluteMeasure
    ? Number(
        next.gramsPerUnit ||
          next.nutritionSnapshot?.gramsPerUnit ||
          Number(item.portionG || 100)
      )
    : null;
  const stored = toStoredPortion(measureUnit, measureAmount, gramsPerUnit);
  const per100g = next.per100g ? sanitizePer100g(next.per100g) : null;
  const baseSnapshot = buildNutritionSnapshot(per100g, stored.measureUnit, stored.measureAmount) || {};

  const reportValues = {};
  for (const key of FATSECRET_REPORT_KEYS) {
    reportValues[key] =
      per100g && Object.prototype.hasOwnProperty.call(per100g, key)
        ? per100g[key]
        : next.nutritionSnapshot?.[key] ?? null;
  }

  return {
    ...next,
    quantity: stored.quantity,
    portionG: stored.portionG,
    measureUnit: stored.measureUnit,
    measureAmount: stored.measureAmount,
    gramsPerUnit: stored.gramsPerUnit,
    per100g: per100g ? { ...per100g, ...reportValues } : reportValues,
    nutritionSnapshot: {
      ...baseSnapshot,
      ...reportValues,
      amountLabel: next.nutritionSnapshot?.amountLabel,
      portionEstimated: Boolean(next.nutritionSnapshot?.portionEstimated),
      measureUnit: stored.measureUnit,
      measureAmount: stored.measureAmount,
      ...(stored.gramsPerUnit ? { gramsPerUnit: stored.gramsPerUnit } : {})
    }
  };
}

function mapApiPlanToDraft(plan) {
  if (!plan) return null;

  return {
    title: plan.title || "Plano Alimentar",
    notes: plan.notes || "",
    status: plan.status || "active",
    source: plan.source || "fatsecret_csv",
    sourcePdfPath: plan.source_pdf_path || plan.sourcePdfPath || null,
    extractionSummary: plan.extraction_summary || plan.extractionSummary || null,
    extractionMethod: plan.extraction_method || plan.extractionMethod || null,
    meals: (plan.diet_meals || plan.meals || []).map((meal, index) => ({
      clientId: meal.id || crypto.randomUUID(),
      name: meal.name,
      sortOrder: meal.sort_order ?? meal.sortOrder ?? index,
      items: (meal.diet_items || meal.items || []).map((item) => {
        const restored = restoreMeasureFromStored(
          item.quantity,
          item.portion_g ?? item.portionG,
          item.nutrition_snapshot || item.nutritionSnapshot
        );

        return rebuildItemSnapshot({
          clientId: item.id || crypto.randomUUID(),
          source: item.source || "fatsecret_csv",
          externalId: item.external_id ?? item.externalId ?? null,
          label: item.label,
          quantity: restored.quantity,
          portionG: restored.portionG,
          measureUnit: restored.measureUnit,
          measureAmount: restored.measureAmount,
          per100g: restored.per100g ? sanitizePer100g(restored.per100g) : null,
          nutritionSnapshot:
            item.nutrition_snapshot ||
            item.nutritionSnapshot ||
            buildNutritionSnapshot(restored.per100g, restored.measureUnit, restored.measureAmount)
        });
      })
    })),
    supplements: mapSupplements(plan),
    referrals: mapReferrals(plan)
  };
}

function draftItemsForAnalysis(meals) {
  return (meals || []).flatMap((meal) =>
    (meal.items || []).map((item) => ({
      per100g: item.per100g,
      quantity: item.quantity,
      portionG: item.portionG,
      portionEstimated: Boolean(item.nutritionSnapshot?.portionEstimated)
    }))
  );
}

function sanitizeListForSave(items, requiredKeys) {
  return (items || [])
    .map((item, index) => ({ ...item, sortOrder: index }))
    .filter((item) => requiredKeys.every((key) => String(item[key] || "").trim()));
}

export default function PacienteDietaPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id;

  const [patient, setPatient] = useState(null);
  const [draft, setDraft] = useState(null);
  const [pendingCsvFile, setPendingCsvFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("neutral");
  const [extractMeta, setExtractMeta] = useState(null);
  const [metabolismOpen, setMetabolismOpen] = useState(false);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [maxReached, setMaxReached] = useState(1);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/patients/${patientId}`).then((r) => r.json()),
      fetch(`/api/patients/${patientId}/diet`).then((r) => r.json())
    ])
      .then(([patientData, dietData]) => {
        const nextPatient = patientData.patient || null;
        setPatient(nextPatient);

        const active =
          (dietData.dietPlans || []).find((plan) => plan.status === "active") ||
          (dietData.dietPlans || [])[0];

        setDraft(active ? mapApiPlanToDraft(active) : emptyDraft(nextPatient?.full_name));
      })
      .catch(() => {
        setFeedbackTone("error");
        setFeedback("Não foi possível carregar o paciente/dieta.");
      });
  }, [patientId]);

  const planTotals = useMemo(() => sumNutrition(draftItemsForAnalysis(draft?.meals)), [draft]);

  const metabolism = useMemo(
    () =>
      computePatientMetabolism({
        sex: patient?.sex,
        birthDate: patient?.birth_date,
        heightCm: patient?.height_cm,
        weightKg: patient?.latest_weight_kg,
        bodyFatPercent: patient?.body_fat_percent,
        activityLevel: patient?.activity_level,
        primaryFormula: patient?.bmr_formula
      }),
    [patient]
  );

  function goToStep(nextStep) {
    setWizardStep(nextStep);
    setMaxReached((current) => Math.max(current, nextStep));
    setFeedback("");
  }

  async function handleCsvUpload(file) {
    setExtracting(true);
    setFeedback("");
    setExtractMeta(null);
    setPendingCsvFile(file || null);

    const planTitle = defaultPlanTitle(patient?.full_name);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", planTitle);

    const response = await fetch(`/api/patients/${patientId}/diet/extract`, {
      method: "POST",
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    setExtracting(false);

    if (!response.ok) {
      setPendingCsvFile(null);
      setFeedbackTone("error");
      setFeedback(data.message || "Falha ao extrair a dieta do CSV.");
      return;
    }

    const nextDraft = mapApiPlanToDraft({
      ...data.plan,
      title: planTitle,
      notes: "",
      diet_meals: (data.plan?.meals || []).map((meal, index) => ({
        ...meal,
        sort_order: meal.sortOrder ?? index,
        diet_items: (meal.items || []).map((item) => ({
          ...item,
          portion_g: item.portionG,
          nutrition_snapshot: item.nutritionSnapshot
        }))
      })),
      diet_supplements: draft?.supplements || [],
      diet_referrals: draft?.referrals || []
    });

    setDraft({
      ...nextDraft,
      supplements: draft?.supplements || [],
      referrals: draft?.referrals || []
    });
    setExtractMeta({
      summary: data.summary,
      method: data.method,
      warning: data.warning
    });

    if (!nextDraft?.meals?.length) {
      setFeedbackTone("error");
      setFeedback("Nenhuma refeição encontrada no CSV.");
    }
  }

  function updateDraftField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateItem(mealClientId, itemClientId, patch) {
    setDraft((current) => ({
      ...current,
      meals: current.meals.map((meal) => {
        if (meal.clientId !== mealClientId) return meal;
        return {
          ...meal,
          items: meal.items.map((item) =>
            item.clientId === itemClientId ? rebuildItemSnapshot(item, patch) : item
          )
        };
      })
    }));
  }

  function removeItem(mealClientId, itemClientId) {
    setDraft((current) => ({
      ...current,
      meals: current.meals
        .map((meal) => {
          if (meal.clientId !== mealClientId) return meal;
          return {
            ...meal,
            items: meal.items.filter((item) => item.clientId !== itemClientId)
          };
        })
        .filter((meal) => meal.items.length > 0)
    }));
  }

  async function savePlan() {
    if (!draft?.meals?.length) {
      setFeedbackTone("error");
      setFeedback("Importe um CSV com refeições antes de publicar.");
      goToStep(1);
      return;
    }

    setSaving(true);
    setFeedback("");

    const payload = {
      title: draft.title,
      notes: draft.notes || null,
      status: "active",
      source: "fatsecret_csv",
      sourcePdfPath: draft.sourcePdfPath || null,
      extractionSummary: draft.extractionSummary || extractMeta?.summary || null,
      extractionMethod: draft.extractionMethod || extractMeta?.method || null,
      meals: draft.meals.map((meal, index) => ({
        name: meal.name,
        sortOrder: index,
        items: meal.items.map((item) => ({
          source: item.source || "fatsecret_csv",
          externalId: item.externalId,
          label: item.label,
          quantity: item.quantity,
          portionG: item.portionG,
          nutritionSnapshot:
            item.nutritionSnapshot ||
            buildNutritionSnapshot(
              item.per100g,
              item.measureUnit || "gramas",
              item.measureAmount || item.portionG
            )
        }))
      })),
      supplements: sanitizeListForSave(draft.supplements, ["productName", "dosage", "posology"]).map(
        (item, index) => ({
          productName: item.productName.trim(),
          dosage: item.dosage.trim(),
          posology: item.posology.trim(),
          notes: item.notes?.trim() || null,
          sortOrder: index
        })
      ),
      referrals: sanitizeListForSave(draft.referrals, ["specialty", "reason"]).map((item, index) => ({
        specialty: item.specialty.trim(),
        professionalName: item.professionalName?.trim() || null,
        reason: item.reason.trim(),
        urgency: item.urgency || "routine",
        notes: item.notes?.trim() || null,
        sortOrder: index
      }))
    };

    let response;
    if (pendingCsvFile) {
      const formData = new FormData();
      formData.append("plan", JSON.stringify(payload));
      formData.append("file", pendingCsvFile);
      response = await fetch(`/api/patients/${patientId}/diet`, {
        method: "POST",
        body: formData
      });
    } else {
      response = await fetch(`/api/patients/${patientId}/diet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    const data = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setFeedbackTone("error");
      setFeedback(data.message || "Erro ao salvar plano.");
      return;
    }

    setPendingCsvFile(null);
    setFeedback("");
    setPublishSuccessOpen(true);
  }

  function goToPatient() {
    setPublishSuccessOpen(false);
    router.push(`/admin/pacientes/${patientId}`);
  }

  return (
    <AdminShell
      title="Prescrição"
      breadcrumbs={["Admin", "Pacientes", patient?.full_name || "...", "Prescrição"]}
    >
      <div className="mb-5 rounded-2xl border border-olive-900/10 bg-porcelain/90 px-4 py-4 sm:px-5">
        <PlanWizardStepper step={wizardStep} maxReached={maxReached} onStepChange={goToStep} />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {metabolism.ok ? (
            <span className="rounded-full bg-olive-100 px-3 py-1.5 text-xs text-olive-900">
              GET <strong className="font-semibold">{Math.round(metabolism.getKcal)} kcal</strong>
            </span>
          ) : null}
          <button type="button" className={btnSecondary()} onClick={() => setMetabolismOpen(true)}>
            <Activity className="h-4 w-4" strokeWidth={1.75} />
            Metabolismo
          </button>
        </div>
        {wizardStep === 1 ? (
          <button
            type="button"
            className={btnSecondary()}
            disabled={extracting}
            onClick={() => {
              setDraft(emptyDraft(patient?.full_name));
              setPendingCsvFile(null);
              setExtractMeta(null);
              setFeedback("");
              setWizardStep(1);
              setMaxReached(1);
            }}
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            Limpar
          </button>
        ) : null}
      </div>

      {wizardStep === 1 ? (
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="space-y-5">
            <Card>
              <CsvUploadZone
                label="CSV FatSecret"
                hint="Detailed Report · até 2 MB"
                uploading={extracting}
                onFileSelect={handleCsvUpload}
              />

              <div className="mt-5 grid gap-3 border-t border-olive-900/10 pt-5">
                <label className="block text-sm text-graphite/70">
                  Título
                  <input
                    className={`mt-1 ${inputClassName()}`}
                    value={draft?.title || ""}
                    onChange={(event) => updateDraftField("title", event.target.value)}
                  />
                </label>
                <label className="block text-sm text-graphite/70">
                  Observações
                  <textarea
                    rows={2}
                    className={`mt-1 ${inputClassName()}`}
                    value={draft?.notes || ""}
                    onChange={(event) => updateDraftField("notes", event.target.value)}
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </Card>

            {(draft?.meals || []).map((meal) => (
              <MealDietAccordion
                key={meal.clientId}
                meal={meal}
                onUpdateItem={updateItem}
                onRemoveItem={removeItem}
              />
            ))}

            {!draft?.meals?.length ? (
              <Card>
                <div className="flex flex-col items-center py-10 text-center">
                  <FileUp className="h-8 w-8 text-olive-700" strokeWidth={1.5} />
                  <p className="mt-3 text-sm text-graphite/55">Envie o CSV para montar o plano.</p>
                </div>
              </Card>
            ) : null}

            {feedback && wizardStep === 1 ? (
              <p
                className={`text-sm ${
                  feedbackTone === "error"
                    ? "text-red-700"
                    : feedbackTone === "success"
                      ? "text-olive-800"
                      : "text-graphite/60"
                }`}
              >
                {feedback}
              </p>
            ) : null}
          </div>

          <div className="space-y-4 xl:sticky xl:top-5">
            {draft?.meals?.length ? (
              <DietNutrientAnalysis
                totals={planTotals}
                items={draftItemsForAnalysis(draft.meals)}
                mealCount={draft.meals.length}
                itemCount={draft.meals.reduce((sum, meal) => sum + meal.items.length, 0)}
                targetKcal={metabolism.ok ? metabolism.getKcal : null}
                patientGoal={patient?.goal}
              />
            ) : (
              <Card title="Total do plano">
                <p className="text-sm text-graphite/50">A análise aparece após importar o CSV.</p>
              </Card>
            )}
          </div>
        </div>
      ) : null}

      {wizardStep === 2 ? (
        <div className="mx-auto max-w-6xl space-y-5">
          <SupplementPrescriptionList
            items={draft?.supplements || []}
            onChange={(supplements) => updateDraftField("supplements", supplements)}
          />
        </div>
      ) : null}

      {wizardStep === 3 ? (
        <div className="mx-auto max-w-6xl space-y-5">
          <ReferralList
            items={draft?.referrals || []}
            onChange={(referrals) => updateDraftField("referrals", referrals)}
          />

          {feedback && feedbackTone === "error" ? (
            <p className="text-sm text-red-700">{feedback}</p>
          ) : null}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-20 mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-olive-900/10 bg-porcelain/95 px-4 py-3 shadow-lg backdrop-blur">
          {wizardStep === 1 ? (
            <>
              <span className="text-sm text-graphite/45">
                {draft?.meals?.length
                  ? `${draft.meals.length} refeições`
                  : "Sem refeições ainda"}
              </span>
              <button
                type="button"
                className={btnPrimary()}
                disabled={!draft?.meals?.length || extracting}
                onClick={() => goToStep(2)}
              >
                Continuar
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </>
          ) : null}

          {wizardStep === 2 ? (
            <>
              <button type="button" className={btnSecondary()} onClick={() => goToStep(1)}>
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                Voltar
              </button>
              <button type="button" className={btnPrimary()} onClick={() => goToStep(3)}>
                Continuar
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </>
          ) : null}

          {wizardStep === 3 ? (
            <>
              <button type="button" className={btnSecondary()} onClick={() => goToStep(2)}>
                <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
                Voltar
              </button>
              <button
                type="button"
                className={btnPrimary()}
                disabled={saving || extracting || !draft?.meals?.length}
                onClick={savePlan}
              >
                <Save className="h-4 w-4" strokeWidth={1.75} />
                {saving ? "Publicando..." : "Publicar plano"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <Modal
        open={metabolismOpen}
        onClose={() => setMetabolismOpen(false)}
        title="Metabolismo (TMB / GET)"
        size="lg"
      >
        <BmrPanel
          patient={patient}
          planKcal={planTotals.kcal || 0}
          onSaved={(nextPatient) => setPatient(nextPatient)}
        />
      </Modal>

      <Modal
        open={publishSuccessOpen}
        onClose={goToPatient}
        size="sm"
      >
        <div className="flex flex-col items-center px-2 pb-2 pt-1 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-olive-100 text-olive-700">
            <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} />
          </span>
          <h3 className="mt-4 text-xl font-semibold text-graphite">Plano publicado</h3>
          <p className="mt-2 max-w-sm text-sm text-graphite/60">
            A prescrição de{" "}
            <span className="font-medium text-graphite">
              {patient?.full_name || "paciente"}
            </span>{" "}
            já está disponível.
          </p>
          <button type="button" className={`${btnPrimary()} mt-6 w-full sm:w-auto`} onClick={goToPatient}>
            <UserRound className="h-4 w-4" strokeWidth={1.75} />
            Ir para o paciente
          </button>
        </div>
      </Modal>
    </AdminShell>
  );
}
