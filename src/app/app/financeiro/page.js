"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PatientShell from "@/components/layout/PatientShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { paymentBadge } from "@/components/ui/Badge";
import { labelPaymentDocType } from "@/lib/labels";
import { formatAppointmentDateTime } from "@/lib/datetime";

export default function PatientFinanceiroPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/patients/me/finance")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || {};
  const appointments = data?.appointments || [];

  return (
    <PatientShell title="Financeiro" breadcrumbs={["Paciente", "Financeiro"]}>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-graphite/45">Total gasto</p>
          <p className="mt-1 text-2xl font-semibold">{formatCurrency(summary.expensesCents || 0)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-graphite/45">Consultas pagas</p>
          <p className="mt-1 text-2xl font-semibold">{summary.paidCount || 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-graphite/45">Pendentes</p>
          <p className="mt-1 text-2xl font-semibold">{summary.pendingCount || 0}</p>
        </Card>
      </div>

      <Card title="Histórico">
        {loading ? (
          <p className="text-sm text-graphite/55">Carregando...</p>
        ) : !appointments.length ? (
          <p className="text-sm text-graphite/55">
            Nenhuma consulta ainda.{" "}
            <Link href="/app/agenda" className="font-medium text-olive-800 hover:underline">
              Agendar
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appt) => {
              const badge = paymentBadge(appt.payment_status);
              return (
                <div
                  key={appt.id}
                  className="rounded-xl border border-olive-900/10 bg-linen/30 px-4 py-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {formatAppointmentDateTime(appt.starts_at)}
                      </p>
                      <p className="mt-1 text-sm">{formatCurrency(appt.amount_cents)}</p>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  {(appt.documents || []).length ? (
                    <ul className="mt-3 space-y-1 border-t border-olive-900/5 pt-3 text-sm">
                      {appt.documents.map((doc) => (
                        <li key={doc.id} className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-graphite/70">
                            {labelPaymentDocType(doc.doc_type)}
                            {doc.extracted_amount_cents != null
                              ? ` · ${formatCurrency(doc.extracted_amount_cents)}`
                              : ""}
                          </span>
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-olive-800 hover:underline"
                            >
                              Ver
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-graphite/45">Sem documentos anexados.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <p className="mt-4 text-sm text-graphite/55">
        Envie comprovantes em{" "}
        <Link href="/app/consultas" className="font-medium text-olive-800 hover:underline">
          Minhas consultas
        </Link>
        .
      </p>
    </PatientShell>
  );
}
