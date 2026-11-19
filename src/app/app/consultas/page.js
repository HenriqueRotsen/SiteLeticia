"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PatientShell from "@/components/layout/PatientShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import SmartTable from "@/components/ui/SmartTable";
import {
  appointmentSearchFields,
  dateSort,
  paymentFilter,
  periodFilter,
  statusFilter
} from "@/components/ui/appointmentTable";
import { formatAppointmentDateTime, resolveAppointmentAmountCents } from "@/lib/datetime";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

const FILTERS = [periodFilter, statusFilter, paymentFilter];

export default function ConsultasPage() {
  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState({ settings: {}, methods: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const load = useCallback(async () => {
    const [a, p] = await Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/payment-info").then((r) => r.json())
    ]);
    setAppointments(a.appointments || []);
    setPayment(p);
  }, []);

  useEffect(() => {
    load()
      .catch(() => setError("Não foi possível carregar as consultas."))
      .finally(() => setLoading(false));
  }, [load]);

  return (
    <PatientShell title="Minhas consultas" breadcrumbs={["Paciente", "Consultas"]}>
      {error ? (
        <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <Card>
        <SmartTable
          rows={appointments}
          loading={loading}
          itemLabel={["consulta", "consultas"]}
          searchPlaceholder="Buscar por data, status…"
          searchFields={(row) => appointmentSearchFields(row)}
          filters={FILTERS}
          defaultSort={{ key: "starts_at", dir: "desc" }}
          emptyMessage="Você ainda não tem consultas."
          noResultsMessage="Nenhuma consulta encontrada com esses filtros."
          onRowDoubleClick={(row) => router.push(`/app/consultas/${row.id}`)}
          columns={[
            {
              key: "starts_at",
              label: "Data",
              mobile: "title",
              nowrap: true,
              ...dateSort,
              render: (row) => (
                <Link href={`/app/consultas/${row.id}`} className="font-medium text-graphite underline-offset-2 hover:text-olive-800 hover:underline">
                  {formatAppointmentDateTime(row.starts_at)}
                </Link>
              )
            },
            {
              key: "modality",
              label: "Modalidade",
              mobile: "subtitle",
              render: (row) => (row.modality === "in_person" ? "Presencial" : "Online")
            },
            {
              key: "status",
              label: "Status",
              mobile: "badges",
              sortValue: (row) => APPOINTMENT_STATUS_LABELS[row.status],
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => {
                const badge = appointmentBadge(row.status);
                return <Badge variant={badge.variant}>{badge.label}</Badge>;
              }
            },
            {
              key: "payment",
              label: "Pagamento",
              sortValue: (row) => PAYMENT_STATUS_LABELS[row.payment_status],
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => {
                const badge = paymentBadge(row.payment_status);
                return <Badge variant={badge.variant}>{badge.label}</Badge>;
              }
            },
            {
              key: "amount",
              label: "Valor",
              nowrap: true,
              render: (row) => formatCurrency(resolveAppointmentAmountCents(row, payment.settings))
            },
            {
              key: "actions",
              label: "",
              mobile: "actions",
              render: (row) => (
                <Link href={`/app/consultas/${row.id}`} className="font-semibold text-olive-800 hover:underline">
                  Abrir
                </Link>
              )
            }
          ]}
        />
      </Card>

      <Card className="mt-4">
        <h3 className="font-semibold">Instruções de pagamento</h3>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.instructions}</p>
        <p className="mt-2 text-sm text-graphite/70">{payment.settings?.cancellation_policy}</p>
      </Card>
    </PatientShell>
  );
}
