"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { Card, btnPrimary, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import {
  PRECONSULT_SECTIONS,
  emptyPreconsultAnswers,
  normalizePreconsultAnswers,
  validatePreconsultAnswers,
  countFilledAnswers,
  mergePrefillAnswers
} from "@/lib/preconsult/schema";

export default function PreconsultForm({
  initialAnswers = null,
  initialStatus = "draft",
  patientProfile = null,
  onSubmit,
  submitting = false,
  compact = false
}) {
  const [answers, setAnswers] = useState(() =>
    mergePrefillAnswers(initialAnswers || emptyPreconsultAnswers(), patientProfile || {})
  );
  const [sectionIndex, setSectionIndex] = useState(0);
  const [error, setError] = useState("");

  const section = PRECONSULT_SECTIONS[sectionIndex];
  const editableFields = section.fields.filter((field) => !field.fromProfile);
  const profileSummary = useMemo(() => {
    const items = [];
    if (answers.fullName) items.push({ label: "Nome", value: answers.fullName });
    if (answers.age) items.push({ label: "Idade", value: `${answers.age} anos` });
    if (answers.mainGoal) items.push({ label: "Objetivo do cadastro", value: answers.mainGoal });
    return items;
  }, [answers.fullName, answers.age, answers.mainGoal]);

  const filled = useMemo(() => countFilledAnswers(answers), [answers]);
  const total = PRECONSULT_SECTIONS.reduce((sum, item) => sum + item.fields.length, 0);
  const progress = Math.round((filled / Math.max(total, 1)) * 100);
  const isLast = sectionIndex === PRECONSULT_SECTIONS.length - 1;

  function updateField(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setError("");
    const withProfile = mergePrefillAnswers(answers, patientProfile || {});
    const validation = validatePreconsultAnswers(withProfile);
    if (!validation.ok) {
      setError(
        `Preencha os campos obrigatórios: ${validation.missing.slice(0, 3).join("; ")}${
          validation.missing.length > 3 ? "…" : ""
        }`
      );
      const firstMissingSection = PRECONSULT_SECTIONS.findIndex((sec) =>
        sec.fields.some(
          (field) =>
            !field.fromProfile &&
            field.required &&
            !String(withProfile[field.key] || "").trim()
        )
      );
      if (firstMissingSection >= 0) setSectionIndex(firstMissingSection);
      return;
    }
    await onSubmit?.(validation.answers);
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <Card className="overflow-hidden border-olive-200/80 bg-gradient-to-br from-olive-50 via-porcelain to-linen p-0 sm:p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-olive-700 text-white shadow-sm">
              <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive-700/80">
                Antes da 1ª consulta
              </p>
              <h2 className="mt-1 font-display text-3xl text-graphite">Ficha pré-consulta</h2>
              <p className="mt-2 max-w-xl text-base leading-7 text-graphite/70">
                Preencha com o máximo de detalhes possível. Nome e objetivo já vêm do seu cadastro —
                as respostas ficam disponíveis para a nutricionista.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-olive-900/8">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">
              Progresso
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-olive-800">{progress}%</p>
            <p className="text-sm text-graphite/50">
              {filled}/{total} campos · {initialStatus === "submitted" ? "enviada" : "rascunho"}
            </p>
          </div>
        </div>
        <div className="h-1.5 bg-olive-100">
          <div className="h-full bg-olive-700 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      {profileSummary.length ? (
        <Card className="border-olive-200/70 bg-olive-50/40">
          <p className="text-sm font-semibold text-olive-900">Dados do seu cadastro</p>
          <p className="mt-1 text-sm text-graphite/60">
            Já preenchidos automaticamente. Para alterar nome ou objetivo, use Meu perfil.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {profileSummary.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-olive-900/8 bg-white/80 px-4 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-graphite/45">
                  {item.label}
                </dt>
                <dd className="mt-1 text-base font-medium text-graphite">{item.value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PRECONSULT_SECTIONS.map((item, index) => {
          const active = index === sectionIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSectionIndex(index)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-olive-700 text-white"
                  : "border border-olive-900/10 bg-white text-graphite/65 hover:border-olive-300"
              }`}
            >
              {index + 1}. {item.title.replace(/^\d+\.\s*/, "").split("—")[0].trim()}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-graphite">{section.title}</h3>
          {section.description ? (
            <p className="mt-2 text-base leading-7 text-graphite/60">{section.description}</p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {editableFields.map((field) => {
            const cols = field.cols || 3;
            const span =
              cols === 1 ? "sm:col-span-1" : cols === 2 ? "sm:col-span-2" : "sm:col-span-3";
            return (
              <label
                key={field.key}
                className={`block text-sm font-medium leading-6 text-graphite/75 ${span}`}
              >
                {field.label}
                {field.required ? <span className="text-rose-500"> *</span> : null}
                {field.type === "textarea" ? (
                  <textarea
                    className={`mt-2 min-h-[120px] text-base leading-7 ${inputClassName()}`}
                    value={answers[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder="Escreva aqui…"
                  />
                ) : (
                  <input
                    className={`mt-2 text-base ${inputClassName()}`}
                    value={answers[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    placeholder="…"
                  />
                )}
              </label>
            );
          })}
        </div>

        {error ? (
          <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-olive-900/8 pt-5">
          <button
            type="button"
            className={btnSecondary()}
            disabled={sectionIndex === 0}
            onClick={() => setSectionIndex((value) => Math.max(0, value - 1))}
          >
            Anterior
          </button>
          <div className="flex flex-wrap gap-2">
            {!isLast ? (
              <button
                type="button"
                className={btnPrimary()}
                onClick={() =>
                  setSectionIndex((value) => Math.min(PRECONSULT_SECTIONS.length - 1, value + 1))
                }
              >
                Próxima seção
              </button>
            ) : (
              <button
                type="button"
                className={btnPrimary()}
                disabled={submitting}
                onClick={handleSubmit}
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                {submitting ? "Enviando…" : "Enviar ficha e continuar"}
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
