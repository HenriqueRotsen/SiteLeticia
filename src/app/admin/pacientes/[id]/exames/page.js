"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import { Card } from "@/components/layout/AppShell";
import Badge, { labReportBadge } from "@/components/ui/Badge";
import LabReportReview from "@/components/ui/LabReportReview";
import PdfUploadZone from "@/components/ui/PdfUploadZone";
import { labelPublishedBy, labelUploadedBy } from "@/lib/labels";

export default function AdminLabsPage() {
  const params = useParams();
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [reviewingId, setReviewingId] = useState("");

  async function loadReports() {
    const res = await fetch(`/api/patients/${params.id}/labs`);
    const data = await res.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    loadReports();
  }, [params.id]);

  async function uploadPdf(file) {
    setUploading(true);
    setFeedback("");
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/patients/${params.id}/labs`, { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);

    if (!res.ok) {
      setError(data.message || "Erro no upload.");
      return;
    }

    setFeedback("PDF recebido. A análise automática já está disponível para revisão.");
    setReviewingId(data.report?.id || "");
    await loadReports();
  }

  async function saveReview(reportId, interpretationSummary, publish = false) {
    setSavingId(reportId);
    setError("");

    const res = await fetch(`/api/patients/${params.id}/labs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId,
        interpretationSummary,
        ...(publish
          ? { status: "published", publishedBy: "nutritionist" }
          : { status: "draft" })
      })
    });

    setSavingId("");

    if (!res.ok) {
      const data = await res.json();
      setError(data.message || "Erro ao salvar.");
      return;
    }

    setFeedback(publish ? "Exame publicado para o paciente." : "Rascunho salvo.");
    if (publish) setReviewingId("");
    await loadReports();
  }

  return (
    <AdminShell
      title="Exames do paciente"
      subtitle="Upload, revisão com análise automática e publicação"
      breadcrumbs={["Admin", "Pacientes", "Exames"]}
      userName="Letícia"
    >
      <Card className="mb-6">
        <PdfUploadZone
          label="Enviar PDF de exames"
          description="Letícia ou o paciente podem enviar laudos. A inteligência extrai marcadores e gera um parecer inicial."
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

      <Card title="Histórico de laudos">
        {!reports.length ? (
          <p className="py-8 text-center text-sm text-graphite/45">Nenhum exame enviado ainda.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const badge = labReportBadge(report.status);
              const isReviewing = reviewingId === report.id;

              return (
                <article
                  key={report.id}
                  className="rounded-2xl border border-olive-900/10 bg-linen/40 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-graphite">
                        {new Date(report.created_at).toLocaleString("pt-BR")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        {report.uploaded_by ? (
                          <Badge variant="neutral">{labelUploadedBy(report.uploaded_by)}</Badge>
                        ) : null}
                        {report.published_by ? (
                          <Badge variant="info">{labelPublishedBy(report.published_by)}</Badge>
                        ) : null}
                      </div>
                    </div>
                    {report.status === "draft" ? (
                      <button
                        type="button"
                        onClick={() => setReviewingId(isReviewing ? "" : report.id)}
                        className="rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        {isReviewing ? "Fechar revisão" : "Revisar"}
                      </button>
                    ) : report.interpretation_summary ? (
                      <p className="max-w-xl text-sm leading-6 text-graphite/70">{report.interpretation_summary}</p>
                    ) : null}
                  </div>

                  {isReviewing && report.status === "draft" ? (
                    <LabReportReview
                      report={report}
                      saving={savingId === report.id}
                      publishLabel="Publicar parecer"
                      onCancel={() => setReviewingId("")}
                      onSaveDraft={(text) => saveReview(report.id, text, false)}
                      onPublish={(text) => saveReview(report.id, text, true)}
                    />
                  ) : report.status === "published" && report.interpretation_summary && !isReviewing ? (
                    <p className="mt-4 whitespace-pre-line rounded-2xl border border-olive-900/10 bg-white p-4 text-sm leading-6 text-graphite/75">
                      {report.interpretation_summary}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
