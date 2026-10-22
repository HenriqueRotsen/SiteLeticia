"use client";

import { Fragment, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Clock } from "lucide-react";
import { Card, btnPrimary, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import {
  PRECONSULT_SECTIONS,
  emptyPreconsultAnswers,
  validatePreconsultAnswers,
  getMissingRequiredInSection,
  estimateRemainingMinutes,
  getRequiredProgress,
  mergePrefillAnswers,
  isFieldVisible,
  parseMultiValues,
  serializeMultiValues
} from "@/lib/preconsult/schema";

const EXCLUSIVE_NONE = new Set(["nao", "nenhum", "nao_sei", "nao_se_aplica"]);

function OptionButton({ selected, label, onClick, multi = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition sm:text-base ${
        selected
          ? "border-olive-700 bg-olive-700 text-white shadow-xs"
          : "border-olive-900/10 bg-white text-graphite/75 hover:border-olive-400 hover:bg-olive-50/70"
      }`}
    >
      <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-current/40 text-[10px]">
        {selected ? (multi ? "✓" : "●") : ""}
      </span>
      {label}
    </button>
  );
}

export default function PreconsultForm({
  initialAnswers = null,
  initialStatus = "draft",
  patientProfile = null,
  onSubmit,
  onSaveProgress = null,
  submitting = false,
  compact = false
}) {
  const [answers, setAnswers] = useState(() =>
    mergePrefillAnswers(initialAnswers || emptyPreconsultAnswers(), patientProfile || {})
  );
  const [sectionIndex, setSectionIndex] = useState(0);
  const [error, setError] = useState("");
  const [savingProgress, setSavingProgress] = useState(false);

  const section = PRECONSULT_SECTIONS[sectionIndex];
  const editableFields = section.fields.filter(
    (field) => !field.fromProfile && isFieldVisible(field, answers)
  );
  const profileSummary = useMemo(() => {
    const items = [];
    if (answers.fullName) items.push({ label: "Nome", value: answers.fullName });
    if (answers.age) items.push({ label: "Idade", value: `${answers.age} anos` });
    if (answers.mainGoal) items.push({ label: "Objetivo do cadastro", value: answers.mainGoal });
    return items;
  }, [answers.fullName, answers.age, answers.mainGoal]);

  const withProfile = useMemo(
    () => mergePrefillAnswers(answers, patientProfile || {}),
    [answers, patientProfile]
  );
  const { done, total, percent: progress } = useMemo(
    () => getRequiredProgress(withProfile),
    [withProfile]
  );
  const minutesLeft = useMemo(() => estimateRemainingMinutes(withProfile), [withProfile]);
  const lastRequiredIndex = PRECONSULT_SECTIONS.reduce(
    (last, item, index) => (item.optional ? last : index),
    0
  );
  const isLast = sectionIndex === PRECONSULT_SECTIONS.length - 1;
  const isLastRequired = sectionIndex === lastRequiredIndex && !isLast;

  function updateField(key, value) {
    setError("");
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(key, optionValue) {
    setError("");
    setAnswers((prev) => {
      let selected = parseMultiValues(prev[key]);
      const isExclusive = EXCLUSIVE_NONE.has(optionValue);
      if (selected.includes(optionValue)) {
        selected = selected.filter((item) => item !== optionValue);
      } else if (isExclusive) {
        selected = [optionValue];
      } else {
        selected = [...selected.filter((item) => !EXCLUSIVE_NONE.has(item)), optionValue];
      }
      return { ...prev, [key]: serializeMultiValues(selected) };
    });
  }

  function assertSectionComplete(index) {
    const withProfile = mergePrefillAnswers(answers, patientProfile || {});
    const missing = getMissingRequiredInSection(PRECONSULT_SECTIONS[index], withProfile);
    if (!missing.length) {
      setError("");
      return true;
    }
    setError(
      `Responda as perguntas obrigatórias desta seção antes de continuar: ${missing
        .slice(0, 3)
        .join("; ")}${missing.length > 3 ? "…" : ""}`
    );
    return false;
  }

  async function persistProgress() {
    if (!onSaveProgress) return true;
    const withProfile = mergePrefillAnswers(answers, patientProfile || {});
    setSavingProgress(true);
    try {
      await onSaveProgress(withProfile);
      return true;
    } catch (err) {
      setError(err?.message || "Não foi possível salvar o progresso. Tente novamente.");
      return false;
    } finally {
      setSavingProgress(false);
    }
  }

  async function goToSection(nextIndex) {
    if (nextIndex === sectionIndex || savingProgress || submitting) return;
    if (nextIndex < sectionIndex) {
      setError("");
      setSectionIndex(nextIndex);
      return;
    }
    for (let index = sectionIndex; index < nextIndex; index += 1) {
      if (!assertSectionComplete(index)) {
        setSectionIndex(index);
        return;
      }
    }
    const saved = await persistProgress();
    if (!saved) return;
    setSectionIndex(nextIndex);
  }

  async function handleSubmit() {
    setError("");
    const withProfile = mergePrefillAnswers(answers, patientProfile || {});
    for (let index = 0; index < PRECONSULT_SECTIONS.length; index += 1) {
      const missing = getMissingRequiredInSection(PRECONSULT_SECTIONS[index], withProfile);
      if (missing.length) {
        setSectionIndex(index);
        setError(
          `Responda as perguntas obrigatórias desta seção: ${missing.slice(0, 3).join("; ")}${
            missing.length > 3 ? "…" : ""
          }`
        );
        return;
      }
    }
    const validation = validatePreconsultAnswers(withProfile);
    if (!validation.ok) {
      setError(
        `Preencha os campos obrigatórios: ${validation.missing.slice(0, 3).join("; ")}${
          validation.missing.length > 3 ? "…" : ""
        }`
      );
      return;
    }
    await onSubmit?.(validation.answers);
  }

  function renderField(field) {
    const cols = field.cols || 3;
    const span = cols === 1 ? "sm:col-span-1" : cols === 2 ? "sm:col-span-2" : "sm:col-span-3";
    const value = answers[field.key] || "";
    const optionalTag =
      !section.optional && !field.fromProfile ? (
        <span className="ml-2 text-xs font-normal text-graphite/45">(opcional)</span>
      ) : null;

    if (field.type === "choice") {
      return (
        <fieldset key={field.key} className={`${span}`}>
          <legend className="text-sm font-medium leading-6 text-graphite/75 sm:text-base">
            {field.label}
            {field.required ? <span className="text-rose-500"> *</span> : optionalTag}
            {field.womenOnly ? (
              <span className="ml-2 text-xs font-normal text-graphite/45">
                (se não se aplica a você, marque “Não se aplica”)
              </span>
            ) : null}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {(field.options || []).map((option) => (
              <OptionButton
                key={option.value}
                selected={value === option.value}
                label={option.label}
                onClick={() => updateField(field.key, option.value)}
              />
            ))}
          </div>
        </fieldset>
      );
    }

    if (field.type === "multichoice") {
      const selected = parseMultiValues(value);
      return (
        <fieldset key={field.key} className={`${span}`}>
          <legend className="text-sm font-medium leading-6 text-graphite/75 sm:text-base">
            {field.label}
            {field.required ? <span className="text-rose-500"> *</span> : optionalTag}
            <span className="ml-2 text-xs font-normal text-graphite/45">
              (pode marcar mais de uma
              {field.womenOnly ? "; use “Não se aplica” se não for o seu caso" : ""})
            </span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {(field.options || []).map((option) => (
              <OptionButton
                key={option.value}
                multi
                selected={selected.includes(option.value)}
                label={option.label}
                onClick={() => toggleMulti(field.key, option.value)}
              />
            ))}
          </div>
        </fieldset>
      );
    }

    if (field.type === "time") {
      return (
        <label
          key={field.key}
          className={`block text-sm font-medium leading-6 text-graphite/75 sm:text-base ${span}`}
        >
          {field.label}
          {field.required ? <span className="text-rose-500"> *</span> : optionalTag}
          <input
            type="time"
            className={`mt-2 text-base ${inputClassName()}`}
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            required={Boolean(field.required)}
          />
        </label>
      );
    }

    if (field.type === "number") {
      return (
        <label
          key={field.key}
          className={`block text-sm font-medium leading-6 text-graphite/75 sm:text-base ${span}`}
        >
          {field.label}
          {field.required ? <span className="text-rose-500"> *</span> : optionalTag}
          <input
            type="number"
            inputMode="decimal"
            className={`mt-2 text-base ${inputClassName()}`}
            value={value}
            min={field.min ?? undefined}
            max={field.max ?? undefined}
            step={field.step ?? "any"}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.max != null ? `0 a ${field.max}` : "0"}
            required={Boolean(field.required)}
          />
        </label>
      );
    }

    return (
      <label
        key={field.key}
        className={`block text-sm font-medium leading-6 text-graphite/75 sm:text-base ${span}`}
      >
        {field.label}
        {field.required ? <span className="text-rose-500"> *</span> : optionalTag}
        {field.type === "textarea" ? (
          <>
            <textarea
              className={`mt-2 text-base leading-7 ${
                field.compact ? "min-h-[76px]" : "min-h-[110px]"
              } ${inputClassName()}`}
              value={value}
              onChange={(e) => updateField(field.key, e.target.value)}
              placeholder={field.compact ? "Ex.: pão com ovos e café com leite" : "Escreva aqui…"}
            />
            {field.quickNone ? (
              <button
                type="button"
                onClick={() => updateField(field.key, field.quickNone)}
                aria-pressed={value === field.quickNone}
                className={`mt-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  value === field.quickNone
                    ? "border-olive-700 bg-olive-700 text-white"
                    : "border-olive-900/10 bg-white text-graphite/65 hover:border-olive-400"
                }`}
              >
                {field.quickNone}
              </button>
            ) : null}
          </>
        ) : (
          <input
            className={`mt-2 text-base ${inputClassName()}`}
            value={value}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder="…"
          />
        )}
      </label>
    );
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <Card className="overflow-hidden border-olive-200/80 bg-gradient-to-br from-olive-50 via-porcelain to-linen p-0 sm:p-0">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-olive-700 text-white shadow-xs">
              <ClipboardList className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-olive-700/80">
                Antes da 1ª consulta
              </p>
              <h2 className="mt-1 font-display text-3xl text-graphite">Ficha pré-consulta</h2>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-graphite/60">
                <Clock className="h-4 w-4" strokeWidth={1.75} />
                Leva cerca de 5 minutos · quase tudo em toques
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 ring-1 ring-olive-900/8">
            <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">
              Progresso
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-olive-800">{progress}%</p>
            <p className="text-sm text-graphite/50">
              {minutesLeft > 0
                ? `Faltam ~${minutesLeft} min · ${done}/${total}`
                : `Tudo pronto · ${initialStatus === "submitted" ? "enviada" : "pode enviar"}`}
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
              onClick={() => goToSection(index)}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-olive-700 text-white"
                  : "border border-olive-900/10 bg-white text-graphite/65 hover:border-olive-300"
              }`}
            >
              {index + 1}. {item.title}
              {item.optional ? <span className="ml-1.5 text-xs font-medium opacity-70">(opcional)</span> : null}
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

        <div className="grid gap-6 sm:grid-cols-3">
          {editableFields.map((field, index) => {
            const showGroup = field.group && field.group !== editableFields[index - 1]?.group;
            return (
              <Fragment key={field.key}>
                {showGroup ? (
                  <p className="border-b border-olive-900/10 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.18em] text-olive-700 sm:col-span-3">
                    {field.group}
                  </p>
                ) : null}
                {renderField(field)}
              </Fragment>
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
            {isLastRequired ? (
              <>
                <button
                  type="button"
                  className={btnSecondary()}
                  disabled={savingProgress || submitting}
                  onClick={() => goToSection(sectionIndex + 1)}
                >
                  {savingProgress ? "Salvando…" : "Responder detalhes extras"}
                </button>
                <button
                  type="button"
                  className={btnPrimary()}
                  disabled={submitting || savingProgress}
                  onClick={handleSubmit}
                >
                  <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                  {submitting ? "Enviando…" : "Enviar ficha"}
                </button>
              </>
            ) : !isLast ? (
              <button
                type="button"
                className={btnPrimary()}
                disabled={savingProgress || submitting}
                onClick={() => goToSection(sectionIndex + 1)}
              >
                {savingProgress ? "Salvando…" : "Continuar"}
              </button>
            ) : (
              <button
                type="button"
                className={btnPrimary()}
                disabled={submitting || savingProgress}
                onClick={handleSubmit}
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
                {submitting ? "Enviando…" : "Enviar ficha"}
              </button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
