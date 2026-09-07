"use client";

import { useEffect, useMemo, useState } from "react";
import { inputClassName } from "@/components/layout/AppShell";
import {
  ACTIVITY_LEVELS,
  BMR_FORMULA_LABELS,
  BMR_FORMULAS,
  computePatientMetabolism,
  formatKcal
} from "@/lib/metabolism/bmr";

const FORMULA_ORDER = [
  BMR_FORMULAS.MIFFLIN_ST_JEOR,
  BMR_FORMULAS.HARRIS_BENEDICT,
  BMR_FORMULAS.FAO_WHO,
  BMR_FORMULAS.KATCH_MCARDLE
];

function normalizeBirthDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function readPatientForm(patient) {
  return {
    sex: patient?.sex || "",
    birthDate: normalizeBirthDate(patient?.birth_date),
    heightCm: patient?.height_cm != null ? String(patient.height_cm) : "",
    weightKg: patient?.latest_weight_kg != null ? String(patient.latest_weight_kg) : "",
    bodyFatPercent:
      patient?.body_fat_percent != null ? String(patient.body_fat_percent) : "",
    activityLevel: patient?.activity_level || "sedentary"
  };
}

export default function BmrPanel({ patient, planKcal, onSaved }) {
  const [form, setForm] = useState(() => readPatientForm(patient));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("neutral");

  useEffect(() => {
    if (!patient) return;
    setForm(readPatientForm(patient));
  }, [patient]);

  const metabolism = useMemo(
    () =>
      computePatientMetabolism({
        sex: form.sex || null,
        birthDate: form.birthDate || null,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        bodyFatPercent: form.bodyFatPercent ? Number(form.bodyFatPercent) : null,
        activityLevel: form.activityLevel
      }),
    [form]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFeedback("");
  }

  async function saveAnthropometrics() {
    if (!patient?.id) return;

    if (!form.sex) {
      setFeedbackTone("error");
      setFeedback("Selecione o sexo antes de salvar.");
      return;
    }

    if (!form.birthDate) {
      setFeedbackTone("error");
      setFeedback("Informe a data de nascimento antes de salvar.");
      return;
    }

    if (!form.heightCm || Number(form.heightCm) <= 0) {
      setFeedbackTone("error");
      setFeedback("Informe a altura antes de salvar.");
      return;
    }

    if (!form.weightKg || Number(form.weightKg) <= 0) {
      setFeedbackTone("error");
      setFeedback("Informe o peso antes de salvar.");
      return;
    }

    setSaving(true);
    setFeedback("");

    const res = await fetch(`/api/admin/patients/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sex: form.sex,
        birthDate: form.birthDate,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        bodyFatPercent: form.bodyFatPercent ? Number(form.bodyFatPercent) : null,
        activityLevel: form.activityLevel
      })
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setFeedbackTone("error");
      setFeedback(data.message || "Erro ao salvar dados.");
      return;
    }

    setFeedbackTone("success");
    setFeedback("Dados salvos.");
    onSaved?.(data.patient);
  }

  const planDelta =
    metabolism.ok && metabolism.tmbKcal != null && planKcal > 0
      ? Math.round(planKcal - metabolism.tmbKcal)
      : null;

  return (
    <div>
      <p className="mb-4 text-sm text-graphite/60">
        Preencha os dados do paciente e clique em salvar. Eles ficam no prontuário e voltam ao recarregar a página.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs text-graphite/60">
          Sexo
          <select
            value={form.sex}
            onChange={(e) => updateField("sex", e.target.value)}
            className={`mt-1 ${inputClassName()}`}
          >
            <option value="">Selecione</option>
            <option value="female">Feminino</option>
            <option value="male">Masculino</option>
          </select>
        </label>

        <label className="block text-xs text-graphite/60">
          Data de nascimento
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => updateField("birthDate", e.target.value)}
            className={`mt-1 ${inputClassName()}`}
          />
        </label>

        <label className="block text-xs text-graphite/60">
          Altura (cm)
          <input
            type="number"
            min="50"
            max="250"
            step="0.1"
            value={form.heightCm}
            onChange={(e) => updateField("heightCm", e.target.value)}
            className={`mt-1 ${inputClassName()}`}
            placeholder="165"
          />
        </label>

        <label className="block text-xs text-graphite/60">
          Peso (kg)
          <input
            type="number"
            min="20"
            max="300"
            step="0.1"
            value={form.weightKg}
            onChange={(e) => updateField("weightKg", e.target.value)}
            className={`mt-1 ${inputClassName()}`}
            placeholder="65"
          />
        </label>

        <label className="block text-xs text-graphite/60">
          % gordura (opcional, Katch-McArdle)
          <input
            type="number"
            min="3"
            max="70"
            step="0.1"
            value={form.bodyFatPercent}
            onChange={(e) => updateField("bodyFatPercent", e.target.value)}
            className={`mt-1 ${inputClassName()}`}
            placeholder="25"
          />
        </label>

        <label className="block text-xs text-graphite/60">
          Nível de atividade (GET)
          <select
            value={form.activityLevel}
            onChange={(e) => updateField("activityLevel", e.target.value)}
            className={`mt-1 ${inputClassName()}`}
          >
            {Object.entries(ACTIVITY_LEVELS).map(([key, level]) => (
              <option key={key} value={key}>
                {level.label} (×{level.factor})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveAnthropometrics}
          disabled={saving || !patient?.id}
          className="rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-olive-800 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar dados do paciente"}
        </button>
        {feedback ? (
          <p
            className={`text-sm ${
              feedbackTone === "error"
                ? "text-rose-700"
                : feedbackTone === "success"
                  ? "text-olive-800"
                  : "text-graphite/70"
            }`}
          >
            {feedback}
          </p>
        ) : null}
      </div>

      {!metabolism.ok ? (
        <p className="mt-4 rounded-xl bg-linen px-3 py-2 text-sm text-graphite/65">
          Informe {metabolism.missing.join(", ")} para calcular a TMB.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-olive-900/10 bg-olive-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-olive-800/70">Referência principal</p>
            <p className="mt-2 text-2xl font-semibold text-graphite">{formatKcal(metabolism.tmbKcal)}</p>
            <p className="mt-1 text-sm text-graphite/60">
              {BMR_FORMULA_LABELS[metabolism.primaryFormula]} · {metabolism.ageYears} anos
            </p>
            <p className="mt-3 text-sm font-medium text-olive-900">
              GET estimado: {formatKcal(metabolism.getKcal)}
            </p>
            {planKcal > 0 ? (
              <p className="mt-2 text-sm text-graphite/65">
                Plano atual: {formatKcal(planKcal)}
                {planDelta != null ? (
                  <span className={planDelta > 0 ? " text-amber-800" : " text-olive-800"}>
                    {" "}
                    ({planDelta > 0 ? "+" : ""}
                    {planDelta} kcal vs TMB)
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-olive-900/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite/50">Comparativo de fórmulas</p>
            <ul className="mt-3 space-y-2">
              {FORMULA_ORDER.map((formula) => {
                const value = metabolism.formulas[formula];
                if (value == null) return null;

                return (
                  <li key={formula} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-graphite/70">{BMR_FORMULA_LABELS[formula]}</span>
                    <span className="font-medium text-graphite">{formatKcal(value)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
