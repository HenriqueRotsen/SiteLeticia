"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import ScheduleAppointmentModal from "@/components/ui/ScheduleAppointmentModal";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import SmartTable from "@/components/ui/SmartTable";
import {
  appointmentSearchFields,
  dateSort,
  modalityFilter,
  paymentFilter,
  periodFilter,
  statusFilter
} from "@/components/ui/appointmentTable";
import { formatAppointmentDateTime } from "@/lib/datetime";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

const FILTERS = [periodFilter, statusFilter, paymentFilter, modalityFilter];

export default function AdminConsultasPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scheduling, setScheduling] = useState(false);

  function load() {
    return fetch("/api/admin/appointments")
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch(() => setError("Não foi possível carregar as consultas."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell title="Consultas" breadcrumbs={["Admin", "Consultas"]} userName="Letícia">
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setScheduling(true)} className={btnPrimary()}>
          <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
          Marcar consulta
        </button>
      </div>
      <ScheduleAppointmentModal open={scheduling} onClose={() => setScheduling(false)} onScheduled={load} />
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
          searchPlaceholder="Paciente, telefone ou data"
          searchFields={(row) => appointmentSearchFields(row, { includePatient: true })}
          filters={FILTERS}
          defaultSort={{ key: "starts_at", dir: "desc" }}
          emptyMessage="Nenhuma consulta ainda."
          noResultsMessage="Nenhuma consulta encontrada com esses filtros."
          onRowDoubleClick={(row) => router.push(`/admin/consultas/${row.id}`)}
          columns={[
            {
              key: "patient",
              label: "Paciente",
              mobile: "title",
              sortValue: (row) => row.patients?.full_name,
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => (
                <Link
                  href={`/admin/pacientes/${row.patient_id}`}
                  className="font-medium text-graphite underline-offset-2 hover:text-olive-800 hover:underline"
                >
                  {row.patients?.full_name || "—"}
                </Link>
              )
            },
            {
              key: "starts_at",
              label: "Data",
              mobile: "subtitle",
              nowrap: true,
              ...dateSort,
              render: (row) => (
                <Link href={`/admin/consultas/${row.id}`} className="underline-offset-2 hover:text-olive-800 hover:underline">
                  {formatAppointmentDateTime(row.starts_at)}
                  {row.modality === "in_person" ? " · Presencial" : ""}
                </Link>
              )
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
              sortValue: (row) => Number(row.amount_cents) || 0,
              sortLabels: ["menor", "maior"],
              render: (row) => formatCurrency(row.amount_cents)
            },
            {
              key: "actions",
              label: "",
              mobile: "actions",
              render: (row) => (
                <Link href={`/admin/consultas/${row.id}`} className="font-semibold text-olive-800 hover:underline">
                  Detalhes
                </Link>
              )
            }
          ]}
        />
      </Card>
    </AdminShell>
  );
}
