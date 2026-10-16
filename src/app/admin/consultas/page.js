"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, btnSecondary, formatCurrency } from "@/components/layout/AppShell";
import Badge, { paymentBadge } from "@/components/ui/Badge";
import PaymentDocUploadZone from "@/components/ui/PaymentDocUploadZone";
import { labelPaymentDocType } from "@/lib/labels";

export default function AdminConsultasPage() {
  const [appointments, setAppointments] = useState([]);
  const [expandedId, setExpandedId] = useState("");
  const [docsByAppt, setDocsByAppt] = useState({});
  const [uploadingId, setUploadingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadDocs = useCallback(async (id) => {
    const res = await fetch(`/api/admin/appointments/${id}/documents`);
    const data = await res.json().catch(() => ({}));
    setDocsByAppt((prev) => ({ ...prev, [id]: data }));
  }, []);

  async function load() {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    setAppointments(data.appointments || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleExpand(id) {
    if (expandedId === id) {
      setExpandedId("");
      return;
    }
    setExpandedId(id);
    await loadDocs(id);
  }

  async function updatePayment(id, paymentStatus) {
    setSavingId(id);
    setError("");
    setFeedback("");
    const res = await fetch(`/api/admin/appointments/${id}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus })
    });
    const data = await res.json().catch(() => ({}));
    setSavingId("");

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
    if (expandedId === id) await loadDocs(id);
  }

  async function uploadInvoice(appointmentId, file) {
    setUploadingId(appointmentId);
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
    setUploadingId("");

    if (!res.ok) {
      setError(data.message || "Erro ao enviar nota fiscal.");
      return;
    }

    if (data.document?.amount_matches === false) {
      setFeedback("Nota fiscal anexada. Atenção: o valor extraído não confere com a consulta.");
    } else {
      setFeedback("Nota fiscal anexada.");
    }
    await loadDocs(appointmentId);
  }

  return (
    <AdminShell title="Consultas" breadcrumbs={["Admin", "Consultas"]} userName="Letícia">
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

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-graphite/50">
                <th className="py-2">Paciente</th>
                <th className="py-2">Data</th>
                <th className="py-2">Valor</th>
                <th className="py-2">Pagamento</th>
                <th className="py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => {
                const badge = paymentBadge(appt.payment_status);
                const open = expandedId === appt.id;
                const docData = docsByAppt[appt.id] || {};
                const summary = docData.summary || {};
                const documents = docData.documents || [];

                return (
                  <Fragment key={appt.id}>
                    <tr className="border-t border-olive-900/5">
                      <td className="py-3">{appt.patients?.full_name}</td>
                      <td className="py-3">{new Date(appt.starts_at).toLocaleString("pt-BR")}</td>
                      <td className="py-3">{formatCurrency(appt.amount_cents)}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          {summary.hasProof && appt.payment_status === "pending" ? (
                            <Badge variant="info">Com comprovante</Badge>
                          ) : null}
                          {summary.hasMismatch ? (
                            <Badge variant="danger">Valor divergente</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => toggleExpand(appt.id)}
                          className="text-olive-800 hover:underline"
                        >
                          {open ? "Fechar" : "Documentos"}
                        </button>
                      </td>
                    </tr>
                    {open ? (
                      <tr className="border-t border-olive-900/5 bg-linen/30">
                        <td colSpan={5} className="px-2 py-4">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <div className="space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">
                                Comprovante e NF
                              </p>
                              {!documents.length ? (
                                <p className="text-sm text-graphite/55">Nenhum documento ainda.</p>
                              ) : (
                                documents.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="rounded-xl border border-olive-900/10 bg-white px-3 py-3"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div>
                                        <p className="font-medium">
                                          {labelPaymentDocType(doc.doc_type)}
                                        </p>
                                        <p className="mt-1 text-xs text-graphite/55">
                                          Extraído:{" "}
                                          {doc.extracted_amount_cents != null
                                            ? formatCurrency(doc.extracted_amount_cents)
                                            : "—"}
                                          {doc.extracted_payer_name
                                            ? ` · ${doc.extracted_payer_name}`
                                            : ""}
                                        </p>
                                        <p className="text-xs text-graphite/45">
                                          Esperado: {formatCurrency(appt.amount_cents)}
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

                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={savingId === appt.id}
                                  onClick={() => updatePayment(appt.id, "paid")}
                                  className={btnPrimary()}
                                >
                                  Validar pagamento
                                </button>
                                <button
                                  type="button"
                                  disabled={savingId === appt.id}
                                  onClick={() => updatePayment(appt.id, "waived")}
                                  className={btnSecondary()}
                                >
                                  Isentar
                                </button>
                                <button
                                  type="button"
                                  disabled={savingId === appt.id}
                                  onClick={() => updatePayment(appt.id, "pending")}
                                  className={btnSecondary()}
                                >
                                  Marcar pendente
                                </button>
                              </div>

                              <PaymentDocUploadZone
                                label="Anexar nota fiscal"
                                description="O sistema confere se o valor da NF bate com a consulta (e com o comprovante, se houver)."
                                uploading={uploadingId === appt.id}
                                onFileSelect={(file) => uploadInvoice(appt.id, file)}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
