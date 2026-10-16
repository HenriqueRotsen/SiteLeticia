"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { btnPrimary, btnSecondary } from "@/components/layout/AppShell";

function flagLabel(flag) {
  if (flag === "high") return "Acima";
  if (flag === "low") return "Abaixo";
  if (flag === "normal") return "Normal";
  return "—";
}

export default function LabReportReview({
  report,
  onSaveDraft,
  onPublish,
  onCancel,
  publishLabel = "Publicar parecer",
  saving = false
}) {
  const [reviewText, setReviewText] = useState(
    report.interpretation_summary || report.ai_interpretation || ""
  );

  useEffect(() => {
    setReviewText(report.interpretation_summary || report.ai_interpretation || "");
  }, [report.id, report.interpretation_summary, report.ai_interpretation]);

  return (
    <div className="mt-4 space-y-4 rounded-2xl border border-olive-200 bg-linen/60 p-4 sm:p-5">
      <div className="rounded-2xl border border-olive-900/10 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold text-graphite">Análise automática</p>
            <p className="mt-1 text-xs text-graphite/45">
              Pré-preenchida pela inteligência do sistema. Revise antes de publicar.
            </p>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-graphite/70">
          {report.ai_interpretation || report.interpretation_summary || "Sem análise automática disponível."}
        </p>
      </div>

      {(report.lab_results || []).length ? (
        <div className="overflow-x-auto rounded-2xl border border-olive-900/10 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-olive-900/10 text-left text-xs uppercase tracking-wide text-graphite/45">
                <th className="px-4 py-3">Marcador</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Referência</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {report.lab_results.map((result) => (
                <tr key={result.id} className="border-t border-olive-900/5">
                  <td className="px-4 py-3">{result.marker_name}</td>
                  <td className="px-4 py-3">
                    {result.value ?? result.value_text} {result.unit}
                  </td>
                  <td className="px-4 py-3">
                    {result.ref_min ?? "—"} – {result.ref_max ?? "—"}
                  </td>
                  <td className="px-4 py-3">{flagLabel(result.flag)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-graphite">Parecer</span>
        <textarea
          value={reviewText}
          onChange={(event) => setReviewText(event.target.value)}
          rows={6}
          className="w-full rounded-xl border border-olive-900/10 bg-white px-4 py-3 text-sm leading-6 text-graphite outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-100"
          placeholder="Edite o parecer clínico antes de publicar..."
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => onSaveDraft?.(reviewText)}
          className={btnSecondary()}
        >
          Salvar rascunho
        </button>
        <button
          type="button"
          disabled={saving || !reviewText.trim()}
          onClick={() => onPublish?.(reviewText)}
          className={btnPrimary()}
        >
          {saving ? "Salvando..." : publishLabel}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className={btnSecondary()}>
            Fechar
          </button>
        ) : null}
      </div>
    </div>
  );
}
