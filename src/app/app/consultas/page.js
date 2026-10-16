"use client";

import { useCallback, useEffect, useState } from "react";
import PatientShell from "@/components/layout/PatientShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import PaymentDocUploadZone from "@/components/ui/PaymentDocUploadZone";
import { labelPaymentDocType } from "@/lib/labels";

function formatExtractedAmount(cents) {
  if (cents == null) return "—";
  return formatCurrency(cents);
}

export default function ConsultasPage() {
  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState({ settings: {}, methods: [] });
  const [docsByAppt, setDocsByAppt] = useState({});
  const [uploadingId, setUploadingId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const loadDocuments = useCallback(async (list) => {
    const entries = await Promise.all(
      (list || []).map(async (appt) => {
        const res = await fetch(`/api/appointments/${appt.id}/documents`);
        const data = await res.json().catch(() => ({}));
        return [appt.id, data];
      })
    );
    setDocsByAppt(Object.fromEntries(entries));
  }, []);

  const load = useCallback(async () => {
    const [a, p] = await Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/payment-info").then((r) => r.json())
    ]);
    const list = a.appointments || [];
    setAppointments(list);
    setPayment(p);
    await loadDocuments(list);
  }, [loadDocuments]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadProof(appointmentId, file) {
    setUploadingId(appointmentId);
    setFeedback("");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/appointments/${appointmentId}/documents`, {
      method: "POST",
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    setUploadingId("");

    if (!res.ok) {
      setError(data.message || "Erro ao enviar comprovante.");
      return;
    }

    setFeedback("Comprovante enviado. Aguarde a validação da nutricionista para liberar a prescrição.");
    await load();
  }

  async function cancelAppointment(appointmentId) {
    if (!window.confirm("Deseja cancelar esta consulta?")) return;
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
      return;
    }
    setFeedback("Consulta cancelada.");
    await load();
  }

  return (
    <PatientShell title="Minhas consultas" breadcrumbs={["Paciente", "Consultas"]}>
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

      {!appointments.length ? (
        <Card>
          <p className="text-graphite/70">Você ainda não tem consultas.</p>
        </Card>
      ) : (
        appointments.map((appt) => {
          const statusBadge = appointmentBadge(appt.status);
          const payBadge = paymentBadge(appt.payment_status);
          const docData = docsByAppt[appt.id] || {};
          const summary = docData.summary || {};
          const documents = docData.documents || [];
          const isPaid = appt.payment_status === "paid" || appt.payment_status === "waived";

          return (
            <Card key={appt.id} className="mb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{new Date(appt.starts_at).toLocaleString("pt-BR")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    <Badge variant={payBadge.variant}>{payBadge.label}</Badge>
                    {summary.hasProof && !isPaid ? (
                      <Badge variant="info">Comprovante enviado</Badge>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm">{formatCurrency(appt.amount_cents)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {appt.meet_link && appt.status === "scheduled" ? (
                    <a
                      href={appt.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-olive-700 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Entrar no Meet
                    </a>
                  ) : null}
                  {appt.status === "scheduled" ? (
                    <button
                      type="button"
                      onClick={() => cancelAppointment(appt.id)}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 hover:bg-rose-100"
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </div>

              {documents.length ? (
                <div className="mt-4 space-y-2 border-t border-olive-900/5 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">
                    Documentos
                  </p>
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
              ) : null}

              {!isPaid ? (
                <div className="mt-4 border-t border-olive-900/5 pt-4">
                  <PaymentDocUploadZone
                    label={summary.hasProof ? "Enviar novo comprovante" : "Enviar comprovante"}
                    description="Após a consulta (ou antes), anexe o PDF ou a foto do pagamento. A prescrição só libera depois da validação."
                    uploading={uploadingId === appt.id}
                    onFileSelect={(file) => uploadProof(appt.id, file)}
                  />
                </div>
              ) : null}
            </Card>
          );
        })
      )}

      <Card className="mt-4">
        <h3 className="font-semibold">Instruções de pagamento</h3>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.instructions}</p>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.cancellation_policy}</p>
      </Card>
    </PatientShell>
  );
}
