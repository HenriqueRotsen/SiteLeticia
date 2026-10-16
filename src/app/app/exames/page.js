"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, CalendarMinus2, CheckCircle2, ExternalLink, Pencil, Trash2 } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import { Card, btnSecondary } from "@/components/layout/AppShell";
import Badge, { labReportBadge } from "@/components/ui/Badge";
import ExamOrderStatusList from "@/components/ui/ExamOrderStatusList";
import HelpTooltip from "@/components/ui/HelpTooltip";
import PdfUploadZone from "@/components/ui/PdfUploadZone";
import { countExamProgress } from "@/lib/labs/exam-status";

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
  const [examOrders, setExamOrders] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [declaredTiming, setDeclaredTiming] = useState("");
  const [busyId, setBusyId] = useState("");
  const replaceInputRef = useRef(null);
  const [replaceTargetId, setReplaceTargetId] = useState("");

  async function loadReports() {
    const res = await fetch("/api/patients/me/labs");
    const data = await res.json();
    setReports(data.reports || []);
    setExamOrders(data.examOrders || []);
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function runAnalysis(reportId, timing) {
    setUploadStatus("Validando e analisando com IA...");
    const res = await fetch("/api/patients/me/labs/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, declaredTiming: timing })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || "Falha na análise automática.");
    }
    return data;
  }

  function feedbackFromAnalysis(analyzed) {
    if (analyzed?.validation?.code === "before_consultation") {
      return "PDF enviado. Como o laudo é anterior à consulta, ele ficou arquivado e não preencheu os exames solicitados.";
    }
    const done = analyzed?.fulfillment?.doneCount || 0;
    if (done > 0) {
      return `PDF enviado. ${done} exame(s) do pedido foram identificados e marcados como feitos. A Letícia ainda revisa o parecer.`;
    }
    return "PDF enviado. A Letícia vai revisar e publicar o parecer.";
  }

  async function uploadPdf(file) {
    if (!declaredTiming) {
      setError("Antes de enviar, diga se o exame é anterior ou posterior à consulta.");
      return;
    }

    setUploading(true);
    setUploadStatus("Enviando PDF...");
    setFeedback("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("declaredTiming", declaredTiming);
      const res = await fetch("/api/patients/me/labs", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erro no upload.");
        return;
      }

      if (data.examOrders) setExamOrders(data.examOrders);
      await loadReports();

      let analyzed = null;
      if (data.needsAnalysis && data.report?.id) {
        analyzed = await runAnalysis(data.report.id, declaredTiming);
        if (analyzed.examOrders) setExamOrders(analyzed.examOrders);
      }

      setFeedback(feedbackFromAnalysis(analyzed));
      await loadReports();
    } catch (err) {
      setError(err.message || "Erro no envio.");
      await loadReports();
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  }

  function startReplace(reportId) {
    if (!declaredTiming) {
      setError("Selecione se o exame é anterior ou posterior à consulta antes de substituir.");
      return;
    }
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
    setUploading(true);
    setUploadStatus("Enviando PDF...");
    setError("");
    setFeedback("");

    try {
      const formData = new FormData();
      formData.append("reportId", reportId);
      formData.append("file", file);
      formData.append("declaredTiming", declaredTiming);

      const res = await fetch("/api/patients/me/labs", { method: "PUT", body: formData });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Não foi possível substituir o PDF.");
        return;
      }

      if (data.examOrders) setExamOrders(data.examOrders);
      await loadReports();

      let analyzed = null;
      if (data.needsAnalysis && data.report?.id) {
        analyzed = await runAnalysis(data.report.id, declaredTiming);
        if (analyzed.examOrders) setExamOrders(analyzed.examOrders);
      }

      setFeedback(feedbackFromAnalysis(analyzed).replace("enviado", "atualizado"));
      await loadReports();
    } catch (err) {
      setError(err.message || "Não foi possível substituir o PDF.");
      await loadReports();
    } finally {
      setBusyId("");
      setUploading(false);
      setUploadStatus("");
    }
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
  const progress = countExamProgress(examOrders);

  return (
    <PatientShell
      title="Exames"
      subtitle="Envie o laudo: o sistema analisa o pedido e marca o que já foi feito."
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

      {examOrders.length ? (
        <Card className="mb-6" title="Seu pedido de exames">
          <p className="mb-4 text-sm text-graphite/55">
            {progress.done} de {progress.total} feitos
            {progress.pending ? ` · ${progress.pending} pendente(s)` : ""}
          </p>
          <ExamOrderStatusList orders={examOrders} />
        </Card>
      ) : null}

      <Card className="mb-6">
        <div className="mb-4">
          <p className="text-sm font-semibold text-graphite">Este exame é de quando?</p>
          <p className="mt-1 text-xs text-graphite/50">
            A IA confirma o nome no laudo e a data. Se não for você, o envio é barrado. Se for anterior à
            consulta, o PDF fica salvo, mas não preenche o pedido.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => setDeclaredTiming("after")}
              className={`group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
                declaredTiming === "after"
                  ? "border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100/80 font-semibold text-emerald-950 ring-2 ring-emerald-200/80 shadow-sm"
                  : "border-emerald-200/80 bg-emerald-50/40 text-emerald-900/80 hover:border-emerald-400 hover:bg-emerald-50"
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-emerald-400/15"
              />
              <span className="relative flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    declaredTiming === "after"
                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <CalendarClock className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    Posterior à consulta
                    {declaredTiming === "after" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.25} />
                    ) : null}
                  </span>
                  <span
                    className={`mt-1 block text-xs font-normal ${
                      declaredTiming === "after" ? "text-emerald-800/70" : "text-emerald-800/55"
                    }`}
                  >
                    Pode preencher os exames solicitados
                  </span>
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setDeclaredTiming("before")}
              className={`group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition ${
                declaredTiming === "before"
                  ? "border-orange-500 bg-gradient-to-br from-orange-50 to-amber-100/80 font-semibold text-orange-950 ring-2 ring-orange-200/80 shadow-sm"
                  : "border-orange-200/80 bg-orange-50/40 text-orange-900/80 hover:border-orange-400 hover:bg-orange-50"
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-orange-400/15"
              />
              <span className="relative flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    declaredTiming === "before"
                      ? "bg-orange-500 text-white shadow-sm shadow-orange-500/30"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  <CalendarMinus2 className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    Anterior à consulta
                    {declaredTiming === "before" ? (
                      <CheckCircle2 className="h-4 w-4 text-orange-600" strokeWidth={2.25} />
                    ) : null}
                  </span>
                  <span
                    className={`mt-1 block text-xs font-normal ${
                      declaredTiming === "before" ? "text-orange-800/70" : "text-orange-800/55"
                    }`}
                  >
                    Arquiva o PDF, sem preencher o pedido
                  </span>
                </span>
              </span>
            </button>
          </div>
        </div>

        <PdfUploadZone
          label="Enviar meu exame em PDF"
          description="Escolha acima se o exame é anterior ou posterior à consulta e envie o PDF."
          uploading={uploading}
          statusText={uploadStatus}
          disabled={!declaredTiming}
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

      {!reports.length && !examOrders.length ? (
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
                      {report.meta?.timing === "before" ? (
                        <Badge variant="warning">Anterior à consulta</Badge>
                      ) : null}
                      {report.meta?.usable_for_orders === false ? (
                        <Badge variant="neutral">Não preenche pedido</Badge>
                      ) : null}
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
