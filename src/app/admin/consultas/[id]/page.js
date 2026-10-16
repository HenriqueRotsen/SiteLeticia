"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import PaymentDocUploadZone from "@/components/ui/PaymentDocUploadZone";
import { formatAppointmentDateTime } from "@/lib/datetime";
import { labelPaymentDocType } from "@/lib/labels";

export default function AdminConsultaDetailPage() {
  const params = useParams();
  const appointmentId = params?.id;
  const [appointment, setAppointment] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [summary, setSummary] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    if (!appointmentId) return;
    const [listRes, docsRes] = await Promise.all([
      fetch("/api/admin/appointments"),
      fetch(`/api/admin/appointments/${appointmentId}/documents`)
    ]);
    const listData = await listRes.json().catch(() => ({}));
    const docsData = await docsRes.json().catch(() => ({}));
    const found = (listData.appointments || []).find((item) => item.id === appointmentId) || null;
    setAppointment(found);
    setDocuments(docsData.documents || []);
    setSummary(docsData.summary || {});
    if (!found) setError("Consulta não encontrada.");
  }, [appointmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePayment(paymentStatus) {
    setSaving(true);
    setError("");
    setFeedback("");
    const res = await fetch(`/api/admin/appointments/${appointmentId}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.message || "Erro ao atualizar pagamento.");
      return;
    }
    setFeedback(
      paymentStatus === "paid"
        ? "Pagamento validado. A prescrição fica liberada para o paciente."
        : "Status de pagamento atualizado."
    );
    await load();
  }

  async function uploadInvoice(file) {
    setUploading(true);
    setError("");
    setFeedback("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", "invoice");
    const res = await fetch(`/api/admin/appointments/${appointmentId}/documents`, {
      method: "POST",
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    setUploading(false);
    if (!res.ok) {
      setError(data.message || "Erro ao enviar nota fiscal.");
      return;
    }
    setFeedback(
      data.document?.amount_matches === false
        ? "Nota fiscal anexada. Atenção: o valor extraído não confere com a consulta."
        : "Nota fiscal anexada."
    );
    await load();
  }

  async function cancelAppointment() {
    if (!window.confirm("Cancelar esta consulta?")) return;
    setCancelling(true);
    setError("");
    setFeedback("");
    const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" })
    });
    const data = await res.json().catch(() => ({}));
    setCancelling(false);
    if (!res.ok) {
      setError(data.message || "Não foi possível cancelar.");
      return;
    }
    setFeedback("Consulta cancelada.");
    await load();
  }

  if (!appointment && !error) {
    return (
      <AdminShell title="Consulta" breadcrumbs={["Admin", "Consultas", "Detalhe"]} userName="Letícia">
        <Card>
          <p className="text-sm text-graphite/55">Carregando...</p>
        </Card>
      </AdminShell>
    );
  }

  if (!appointment) {
    return (
      <AdminShell title="Consulta" breadcrumbs={["Admin", "Consultas", "Detalhe"]} userName="Letícia">
        <Card>
          <p className="text-sm text-rose-700">{error || "Consulta não encontrada."}</p>
          <Link href="/admin/consultas" className="mt-4 inline-block font-semibold text-olive-800 hover:underline">
            Voltar para a lista
          </Link>
        </Card>
      </AdminShell>
    );
  }

  const status = appointmentBadge(appointment.status);
  const payment = paymentBadge(appointment.payment_status);

  return (
    <AdminShell
      title="Detalhe da consulta"
      breadcrumbs={["Admin", "Consultas", appointment.patients?.full_name || "Detalhe"]}
      userName="Letícia"
    >
      <div className="mb-4">
        <Link href="/admin/consultas" className="text-sm font-semibold text-olive-800 hover:underline">
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
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-wide text-graphite/45">Paciente</dt>
              <dd className="mt-1 font-medium">{appointment.patients?.full_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-graphite/45">Data</dt>
              <dd className="mt-1">{formatAppointmentDateTime(appointment.starts_at)}</dd>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
              <Badge variant={payment.variant}>{payment.label}</Badge>
              {summary.hasProof && appointment.payment_status === "pending" ? (
                <Badge variant="info">Com comprovante</Badge>
              ) : null}
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-graphite/45">Valor</dt>
              <dd className="mt-1 font-medium">{formatCurrency(appointment.amount_cents)}</dd>
            </div>
            {appointment.meet_link ? (
              <div>
                <a
                  href={appointment.meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-olive-800 hover:underline"
                >
                  Abrir Google Meet
                </a>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => updatePayment("paid")}
              className={btnPrimary()}
            >
              Validar pagamento
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => updatePayment("waived")}
              className={btnSecondary()}
            >
              Isentar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => updatePayment("pending")}
              className={btnSecondary()}
            >
              Marcar pendente
            </button>
            {appointment.status === "scheduled" ? (
              <button
                type="button"
                disabled={cancelling}
                onClick={cancelAppointment}
                className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-60"
              >
                {cancelling ? "Cancelando..." : "Cancelar consulta"}
              </button>
            ) : null}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-graphite">Documentos</h2>
          <div className="mt-4 space-y-3">
            {!documents.length ? (
              <p className="text-sm text-graphite/55">Nenhum documento ainda.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-olive-900/10 bg-linen/40 px-3 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{labelPaymentDocType(doc.doc_type)}</p>
                      <p className="mt-1 text-xs text-graphite/55">
                        Extraído:{" "}
                        {doc.extracted_amount_cents != null
                          ? formatCurrency(doc.extracted_amount_cents)
                          : "—"}
                        {doc.extracted_payer_name ? ` · ${doc.extracted_payer_name}` : ""}
                      </p>
                      <p className="text-xs text-graphite/45">
                        Esperado: {formatCurrency(appointment.amount_cents)}
                        {doc.amount_matches === true ? " · confere" : ""}
                        {doc.amount_matches === false ? " · não confere" : ""}
                      </p>
                    </div>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-olive-800 hover:underline"
                      >
                        Abrir
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6">
            <PaymentDocUploadZone
              label="Anexar nota fiscal"
              description="O sistema confere se o valor da NF bate com a consulta."
              uploading={uploading}
              onFileSelect={uploadInvoice}
            />
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
