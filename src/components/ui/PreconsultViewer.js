"use client";

import { ClipboardList } from "lucide-react";
import { Card } from "@/components/layout/AppShell";
import {
  PRECONSULT_SECTIONS,
  countFilledAnswers,
  formatAnswerLabel,
  isFieldVisible
} from "@/lib/preconsult/schema";

function formatSubmittedAt(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function PreconsultViewer({
  form = null,
  patientName = null,
  emptyMessage = "Este paciente ainda não enviou a ficha pré-consulta."
}) {
  if (!form || form.status !== "submitted") {
    return (
      <Card>
        <div className="flex flex-col items-center py-10 text-center">
          <ClipboardList className="h-8 w-8 text-graphite/20" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-graphite/50">{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  const answers = form.answers || {};
  const filled = countFilledAnswers(answers);
  const submittedLabel = formatSubmittedAt(form.submitted_at);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-olive-200/80 bg-gradient-to-br from-olive-50 via-porcelain to-linen p-0 sm:p-0">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-olive-700 text-white">
              <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-olive-700/70">
                Ficha do paciente
              </p>
              <h2 className="mt-1 font-display text-2xl text-graphite">
                Pré-consulta{patientName ? ` — ${patientName}` : ""}
              </h2>
              <p className="mt-1 text-sm text-graphite/60">
                {filled} campos preenchidos
                {submittedLabel ? ` · enviada em ${submittedLabel}` : ""}
              </p>
            </div>
          </div>
          <span className="inline-flex w-fit rounded-full bg-olive-100 px-3 py-1.5 text-xs font-semibold text-olive-800">
            Enviada
          </span>
        </div>
      </Card>

      {PRECONSULT_SECTIONS.map((section) => {
        const entries = section.fields
          .filter((field) => isFieldVisible(field, answers))
          .map((field) => ({
            label: field.label,
            value: formatAnswerLabel(field, answers[field.key]).trim()
          }))
          .filter((item) => item.value);

        if (!entries.length) return null;

        return (
          <Card key={section.id}>
            <h3 className="font-semibold text-graphite">{section.title}</h3>
            {section.description ? (
              <p className="mt-1 text-sm text-graphite/50">{section.description}</p>
            ) : null}
            <dl className="mt-4 space-y-4">
              {entries.map((item) => (
                <div key={item.label} className="rounded-2xl border border-olive-900/8 bg-linen/40 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-graphite/40">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-graphite/80">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        );
      })}
    </div>
  );
}
