"use client";

import { useEffect, useState } from "react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import Badge, { labReportBadge } from "@/components/ui/Badge";
import HelpTooltip from "@/components/ui/HelpTooltip";
import LabReportReview from "@/components/ui/LabReportReview";
import PdfUploadZone from "@/components/ui/PdfUploadZone";
import { labelPublishedBy } from "@/lib/labels";

function flagLabel(flag) {
  if (flag === "high") return "Acima";
  if (flag === "low") return "Abaixo";
  if (flag === "normal") return "Normal";
  return "—";
}

export default function ExamesPage() {
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [reviewingId, setReviewingId] = useState("");

  async function loadReports() {
    const res = await fetch("/api/patients/me/labs");
    const data = await res.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function uploadPdf(file) {
    setUploading(true);
    setFeedback("");
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/patients/me/labs", { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      setError(data.message || "Erro no upload.");
      return;
    }

    setFeedback("PDF enviado. Revise a análise automática e publique quando quiser.");
    setReviewingId(data.report?.id || "");
    await loadReports();
  }

  async function saveReview(reportId, interpretationSummary, publish = false) {
    setSavingId(reportId);
    setError("");

    const res = await fetch("/api/patients/me/labs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId,
        interpretationSummary,
        ...(publish ? { status: "published" } : {})
      })
    });

    setSavingId("");

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Erro ao salvar.");
      return;
    }

    setFeedback(
      publish
        ? "Exame publicado no seu portal. A Letícia ainda pode complementar o parecer."
        : "Rascunho salvo."
    );
    if (publish) setReviewingId("");
    await loadReports();
  }

  const drafts = reports.filter((report) => report.status === "draft");
  const published = reports.filter((report) => report.status === "published");

  return (
    <PatientShell
      title="Exames"
      subtitle="Envie laudos, revise a análise automática e publique quando desejar"
      breadcrumbs={["Paciente", "Exames"]}
    >
      <Card className="mb-6">
        <PdfUploadZone
          label="Enviar meu exame em PDF"
          description="Você ou a Letícia podem enviar laudos. O sistema gera uma análise inicial para revisão."
          uploading={uploading}
          onFileSelect={uploadPdf}
        />
        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
        ) : null}
        {feedback ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </p>
        ) : null}
      </Card>

      {drafts.length ? (
        <Card className="mb-6" title="Aguardando sua revisão">
          <div className="space-y-4">
            {drafts.map((report) => {
              const badge = labReportBadge(report.status);
              const isReviewing = reviewingId === report.id;

              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-graphite">
                        {new Date(report.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      <div className="mt-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewingId(isReviewing ? "" : report.id)}
                      className="rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      {isReviewing ? "Fechar" : "Revisar"}
                    </button>
                  </div>

                  {isReviewing ? (
                    <LabReportReview
                      report={report}
                      saving={savingId === report.id}
                      publishLabel="Publicar no meu portal"
                      onCancel={() => setReviewingId("")}
                      onSaveDraft={(text) => saveReview(report.id, text, false)}
                      onPublish={(text) => saveReview(report.id, text, true)}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        </Card>
      ) : null}

      {!published.length && !drafts.length ? (
        <Card>
          <p className="text-graphite/70">Nenhum exame enviado ainda.</p>
        </Card>
      ) : null}

      {published.length ? (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-graphite">Exames publicados</h2>
          {published.map((report) => (
            <Card key={report.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{new Date(report.created_at).toLocaleDateString("pt-BR")}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="success">Publicado</Badge>
                    {report.published_by ? (
                      <Badge variant="neutral">{labelPublishedBy(report.published_by)}</Badge>
                    ) : null}
                  </div>
                </div>
                <HelpTooltip content="Resultados fora da referência não significam diagnóstico sozinho.">
                  <span className="text-xs text-olive-700">Como ler?</span>
                </HelpTooltip>
              </div>

              {report.interpretation_summary ? (
                <div className="mt-4 rounded-2xl border border-olive-900/10 bg-linen/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-olive-700">Parecer</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-graphite/75">
                    {report.interpretation_summary}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-graphite/50">
                      <th className="py-2">Marcador</th>
                      <th className="py-2">Valor</th>
                      <th className="py-2">Referência</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.lab_results || []).map((result) => (
                      <tr key={result.id} className="border-t border-olive-900/5">
                        <td className="py-2">{result.marker_name}</td>
                        <td className="py-2">
                          {result.value ?? result.value_text} {result.unit}
                        </td>
                        <td className="py-2">
                          {result.ref_min ?? "—"} – {result.ref_max ?? "—"}
                        </td>
                        <td className="py-2">{flagLabel(result.flag)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </PatientShell>
  );
}
