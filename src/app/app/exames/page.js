"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import { Card, btnSecondary } from "@/components/layout/AppShell";
import Badge, { labReportBadge } from "@/components/ui/Badge";
import HelpTooltip from "@/components/ui/HelpTooltip";
import PdfUploadZone from "@/components/ui/PdfUploadZone";

function flagLabel(flag) {
  if (flag === "high") return "Acima";
  if (flag === "low") return "Abaixo";
  if (flag === "normal") return "Normal";
  return "—";
}

function statusLabel(report) {
  if (report.status === "published") return "Publicado pela Letícia";
  return "Aguardando revisão da Letícia";
}

export default function ExamesPage() {
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState("");
  const replaceInputRef = useRef(null);
  const [replaceTargetId, setReplaceTargetId] = useState("");

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

    setFeedback("PDF enviado. A Letícia vai revisar e publicar o parecer.");
    await loadReports();
  }

  function startReplace(reportId) {
    setReplaceTargetId(reportId);
    setError("");
    setFeedback("");
    replaceInputRef.current?.click();
  }

  async function replacePdf(file) {
    if (!file || !replaceTargetId) return;
    const reportId = replaceTargetId;
    setReplaceTargetId("");
    setBusyId(reportId);

    const formData = new FormData();
    formData.append("reportId", reportId);
    formData.append("file", file);

    const res = await fetch("/api/patients/me/labs", { method: "PUT", body: formData });
    const data = await res.json().catch(() => ({}));
    setBusyId("");

    if (!res.ok) {
      setError(data.message || "Não foi possível substituir o PDF.");
      return;
    }

    setFeedback("PDF atualizado. Continua aguardando a revisão da Letícia.");
    await loadReports();
  }

  async function deleteReport(reportId) {
    if (!window.confirm("Excluir este envio de exame?")) return;
    setBusyId(reportId);
    setError("");
    setFeedback("");

    const res = await fetch(`/api/patients/me/labs?id=${encodeURIComponent(reportId)}`, {
      method: "DELETE"
    });
    const data = await res.json().catch(() => ({}));
    setBusyId("");

    if (!res.ok) {
      setError(data.message || "Não foi possível excluir.");
      return;
    }

    setFeedback("Envio excluído.");
    await loadReports();
  }

  const pending = reports.filter((report) => report.status !== "published");
  const published = reports.filter((report) => report.status === "published");

  return (
    <PatientShell
      title="Exames"
      subtitle="Envie laudos em PDF. A análise e o parecer ficam com a Letícia."
      breadcrumbs={["Paciente", "Exames"]}
    >
      <input
        ref={replaceInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          replacePdf(file);
        }}
      />

      <Card className="mb-6">
        <PdfUploadZone
          label="Enviar meu exame em PDF"
          description="Você envia o laudo; a Letícia revisa a análise e publica o parecer no seu portal."
          uploading={uploading}
          onFileSelect={uploadPdf}
        />
        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        {feedback ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </p>
        ) : null}
      </Card>

      {!reports.length ? (
        <Card>
          <p className="text-graphite/70">Nenhum exame enviado ainda.</p>
        </Card>
      ) : null}

      {pending.length ? (
        <Card className="mb-6" title="Meus envios">
          <ul className="divide-y divide-olive-900/8">
            {pending.map((report) => {
              const badge = labReportBadge(report.status);
              const busy = busyId === report.id;

              return (
                <li
                  key={report.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-graphite">
                      {new Date(report.created_at).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={badge.variant}>{statusLabel(report)}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {report.file_url ? (
                      <a
                        href={report.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className={btnSecondary("!px-3 !py-2 text-xs")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                        Ver PDF
                      </a>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => startReplace(report.id)}
                      className={btnSecondary("!px-3 !py-2 text-xs")}
                    >
                      <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                      {busy ? "Atualizando..." : "Substituir"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => deleteReport(report.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                      Excluir
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}

      {published.length ? (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-graphite">Exames publicados</h2>
          {published.map((report) => (
            <Card key={report.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {new Date(report.created_at).toLocaleDateString("pt-BR")}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="success">Publicado</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {report.file_url ? (
                    <a
                      href={report.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className={btnSecondary("!px-3 !py-2 text-xs")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
                      Ver PDF
                    </a>
                  ) : null}
                  <HelpTooltip content="Resultados fora da referência não significam diagnóstico sozinho.">
                    <span className="text-xs text-olive-700">Como ler?</span>
                  </HelpTooltip>
                </div>
              </div>

              {report.interpretation_summary ? (
                <div className="mt-4 rounded-2xl border border-olive-900/10 bg-linen/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-olive-700">
                    Parecer da Letícia
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-graphite/75">
                    {report.interpretation_summary}
                  </p>
                </div>
              ) : null}

              {(report.lab_results || []).length ? (
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
                      {report.lab_results.map((result) => (
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
              ) : null}
            </Card>
          ))}
        </div>
      ) : null}
    </PatientShell>
  );
}
