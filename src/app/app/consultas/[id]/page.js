"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PatientShell from "@/components/layout/PatientShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import PaymentDocUploadZone from "@/components/ui/PaymentDocUploadZone";
import { formatAppointmentDateTime, resolveAppointmentAmountCents } from "@/lib/datetime";
import { labelPaymentDocType } from "@/lib/labels";
import { googleMapsEmbedUrl, googleMapsLink } from "@/lib/appointments/location";
import { useDialog } from "@/components/ui/ConfirmDialog";

function formatExtractedAmount(cents) {
  if (cents == null) return "—";
  return formatCurrency(cents);
}

function canCancelAppointment(appt) {
  const status = String(appt?.status || "")
    .trim()
    .toLowerCase();
  return status === "scheduled" || status === "agendada";
}

export default function PatientConsultaDetailPage() {
  const params = useParams();
  const { confirm } = useDialog();
  const appointmentId = params?.id;
  const [appointment, setAppointment] = useState(null);
  const [payment, setPayment] = useState({ settings: {} });
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    if (!appointmentId) return;
    const [listRes, paymentRes, docsRes] = await Promise.all([
      fetch("/api/appointments"),
      fetch("/api/payment-info"),
      fetch(`/api/appointments/${appointmentId}/documents`)
    ]);
    const listData = await listRes.json().catch(() => ({}));
    const paymentData = await paymentRes.json().catch(() => ({}));
    const docsData = await docsRes.json().catch(() => ({}));
    const found = (listData.appointments || []).find((item) => item.id === appointmentId) || null;
    setAppointment(found);
    setPayment(paymentData);
    setDocuments(docsData.documents || []);
    setSummary(docsData.summary || {});
    if (!found) setError("Consulta não encontrada.");
  }, [appointmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadProof(file) {
    setUploading(true);
    setFeedback("");
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/appointments/${appointmentId}/documents`, {
      method: "POST",
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setError(data.message || "Erro ao enviar comprovante.");
      return;
    }
    setFeedback("Comprovante enviado. Aguarde a validação da nutricionista para liberar a prescrição.");
    await load();
  }

  async function cancelAppointment() {
    const ok = await confirm({
      title: "Cancelar esta consulta?",
      message: "O horário será liberado. Se quiser, você pode agendar outro depois.",
      confirmLabel: "Cancelar consulta",
      cancelLabel: "Manter",
      tone: "danger"
    });
    if (!ok) return;
    setError("");
    setFeedback("");
    const res = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Não foi possível cancelar a consulta.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFeedback("Consulta cancelada.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    await load();
  }

  if (!appointment && !error) {
    return (
      <PatientShell title="Consulta" breadcrumbs={["Paciente", "Consultas", "Detalhe"]}>
        <Card>
          <p className="text-sm text-graphite/55">Carregando...</p>
        </Card>
      </PatientShell>
    );
  }

  if (!appointment) {
    return (
      <PatientShell title="Consulta" breadcrumbs={["Paciente", "Consultas", "Detalhe"]}>
        <Card>
          <p className="text-sm text-rose-700">{error || "Consulta não encontrada."}</p>
          <Link href="/app/consultas" className="mt-4 inline-block font-semibold text-olive-800 hover:underline">
            Voltar para a lista
          </Link>
        </Card>
      </PatientShell>
    );
  }

  const status = appointmentBadge(appointment.status);
  const payBadge = paymentBadge(appointment.payment_status);
  const isPaid = appointment.payment_status === "paid" || appointment.payment_status === "waived";
  const amountCents = resolveAppointmentAmountCents(appointment, payment.settings);
  const showCancel = canCancelAppointment(appointment);

  return (
    <PatientShell title="Detalhe da consulta" breadcrumbs={["Paciente", "Consultas", "Detalhe"]}>
      <div className="mb-4">
        <Link href="/app/consultas" className="text-sm font-semibold text-olive-800 hover:underline">
          ← Voltar para a lista
        </Link>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {feedback ? (
        <p className="mb-4 rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-900">
          {feedback}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-graphite">Resumo</h2>
          <p className="mt-3 text-lg font-semibold">
            {formatAppointmentDateTime(appointment.starts_at)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={payBadge.variant}>{payBadge.label}</Badge>
            {summary.hasProof && !isPaid ? <Badge variant="info">Comprovante enviado</Badge> : null}
          </div>
          <p className="mt-4 text-sm font-medium text-graphite">
            Valor: {formatCurrency(amountCents)}
          </p>

          {appointment.modality === "in_person" ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-olive-900/10">
              <div className="px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">Consulta presencial</p>
                <p className="mt-1 break-words text-sm text-graphite">{appointment.location || "Endereço a confirmar"}</p>
                {appointment.location ? (
                  <a
                    href={googleMapsLink(appointment.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-olive-800 hover:underline"
                  >
                    Abrir no Google Maps
                  </a>
                ) : null}
              </div>
              {appointment.location ? (
                <iframe
                  title="Mapa do local da consulta"
                  src={googleMapsEmbedUrl(appointment.location)}
                  className="block h-56 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : null}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {appointment.meet_link && appointment.modality !== "in_person" && showCancel ? (
              <a
                href={appointment.meet_link}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Entrar no Meet
              </a>
            ) : null}
            {showCancel ? (
              <button
                type="button"
                onClick={cancelAppointment}
                className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-100"
              >
                Cancelar consulta
              </button>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-graphite">Comprovante e documentos</h2>

          {documents.length ? (
            <div className="mt-4 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-linen/50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{labelPaymentDocType(doc.doc_type)}</p>
                    <p className="text-xs text-graphite/55">
                      Valor lido: {formatExtractedAmount(doc.extracted_amount_cents)}
                      {doc.amount_matches === false ? " · divergente" : ""}
                      {doc.amount_matches === true ? " · confere" : ""}
                    </p>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-olive-800 hover:underline"
                    >
                      Ver arquivo
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-graphite/55">Nenhum documento enviado ainda.</p>
          )}

          {!isPaid ? (
            <div className="mt-6">
              <PaymentDocUploadZone
                label={summary.hasProof ? "Enviar novo comprovante" : "Enviar comprovante"}
                description="Anexe o PDF ou a foto do pagamento. A prescrição só libera depois da validação."
                uploading={uploading}
                onFileSelect={uploadProof}
              />
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm text-olive-900">
              Pagamento validado. Não é necessário enviar novo comprovante.
            </p>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h3 className="font-semibold">Instruções de pagamento</h3>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.instructions}</p>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.cancellation_policy}</p>
      </Card>
    </PatientShell>
  );
}
