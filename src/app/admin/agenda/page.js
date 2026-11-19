"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import ScheduleAppointmentModal from "@/components/ui/ScheduleAppointmentModal";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary } from "@/components/layout/AppShell";
import Badge, { appointmentBadge } from "@/components/ui/Badge";
import BookingToggleCard from "@/components/ui/BookingToggleCard";
import SmartTable from "@/components/ui/SmartTable";
import { appointmentSearchFields, dateSort, modalityFilter, periodFilter, statusFilter } from "@/components/ui/appointmentTable";
import { formatAppointmentDateTime } from "@/lib/datetime";

const FILTERS = [periodFilter, statusFilter, modalityFilter];
import { useDialog } from "@/components/ui/ConfirmDialog";

export default function AdminAgendaPage() {
  const [appointments, setAppointments] = useState([]);
  const { confirm } = useDialog();
  const [cancellingId, setCancellingId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    setAppointments(data.appointments || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelAppointment(appointmentId) {
    const ok = await confirm({
      title: "Cancelar esta consulta?",
      message: "O horário volta a ficar livre na agenda.",
      confirmLabel: "Cancelar consulta",
      cancelLabel: "Manter",
      tone: "danger"
    });
    if (!ok) return;
    setCancellingId(appointmentId);
    setError("");
    setFeedback("");
    const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" })
    });
    const data = await res.json().catch(() => ({}));
    setCancellingId("");
    if (!res.ok) {
      setError(data.message || "Não foi possível cancelar.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setFeedback("Consulta cancelada.");
    window.scrollTo({ top: 0, behavior: "smooth" });
    await load();
  }

  return (
    <AdminShell title="Agenda" breadcrumbs={["Admin", "Agenda"]} userName="Letícia">
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={() => setScheduling(true)} className={btnPrimary()}>
          <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
          Marcar consulta
        </button>
      </div>
      <ScheduleAppointmentModal open={scheduling} onClose={() => setScheduling(false)} onScheduled={load} />
      <BookingToggleCard onFeedback={setFeedback} onError={setError} />
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
        <SmartTable
          rows={appointments}
          loading={loading}
          itemLabel={["consulta", "consultas"]}
          searchPlaceholder="Paciente, telefone ou data"
          searchFields={(row) => appointmentSearchFields(row, { includePatient: true })}
          filters={FILTERS}
          initialFilters={{ period: "upcoming" }}
          defaultSort={{ key: "starts_at", dir: "asc" }}
          emptyMessage="Nenhuma consulta na agenda."
          noResultsMessage="Nenhuma consulta com esses filtros."
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
              label: "Horário",
              mobile: "subtitle",
              nowrap: true,
              ...dateSort,
              render: (row) => (
                <Link href={`/admin/consultas/${row.id}`} className="underline-offset-2 hover:text-olive-800 hover:underline">
                  {formatAppointmentDateTime(row.starts_at)}
                </Link>
              )
            },
            {
              key: "status",
              label: "Status",
              mobile: "badges",
              render: (row) => {
                const badge = appointmentBadge(row.status);
                return (
                  <div className="flex flex-wrap justify-end gap-1 xl:justify-start">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {row.modality === "in_person" ? <Badge variant="info">Presencial</Badge> : null}
                  </div>
                );
              }
            },
            {
              key: "meet",
              label: "Meet",
              mobile: "actions",
              render: (row) =>
                row.meet_link && row.status === "scheduled" ? (
                  <a href={row.meet_link} target="_blank" rel="noreferrer" className="font-semibold text-olive-700 underline">
                    Abrir Meet
                  </a>
                ) : (
                  <span className="hidden text-graphite/35 xl:inline">—</span>
                )
            },
            {
              key: "actions",
              label: "Ações",
              mobile: "actions",
              render: (row) =>
                row.status === "scheduled" ? (
                  <button
                    type="button"
                    disabled={cancellingId === row.id}
                    onClick={() => cancelAppointment(row.id)}
                    className="text-sm font-semibold text-rose-700 hover:underline disabled:opacity-50"
                  >
                    {cancellingId === row.id ? "Cancelando..." : "Cancelar"}
                  </button>
                ) : (
                  <span className="hidden text-graphite/35 xl:inline">—</span>
                )
            }
          ]}
        />
      </Card>
    </AdminShell>
  );
}
