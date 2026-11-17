"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import ScheduleAppointmentModal from "@/components/ui/ScheduleAppointmentModal";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary } from "@/components/layout/AppShell";
import Badge, { appointmentBadge } from "@/components/ui/Badge";
import BookingToggleCard from "@/components/ui/BookingToggleCard";
import { useDialog } from "@/components/ui/ConfirmDialog";

export default function AdminAgendaPage() {
  const [appointments, setAppointments] = useState([]);
  const { confirm } = useDialog();
  const [cancellingId, setCancellingId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [scheduling, setScheduling] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    setAppointments(data.appointments || []);
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
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-graphite/50">
              <th className="py-2">Paciente</th>
              <th className="py-2">Horário</th>
              <th className="py-2">Status</th>
              <th className="py-2">Meet</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt) => {
              const badge = appointmentBadge(appt.status);

              return (
                <tr key={appt.id} className="border-t border-olive-900/5">
                  <td className="py-3">
                    <Link href={`/admin/pacientes/${appt.patient_id}`} className="font-medium text-graphite underline-offset-2 hover:text-olive-800 hover:underline">
                      {appt.patients?.full_name || "—"}
                    </Link>
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/consultas/${appt.id}`} className="underline-offset-2 hover:text-olive-800 hover:underline">
                      {new Date(appt.starts_at).toLocaleString("pt-BR")}
                    </Link>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                      {appt.modality === "in_person" ? <Badge variant="info">Presencial</Badge> : null}
                    </div>
                  </td>
                  <td className="py-3">
                    {appt.meet_link && appt.status === "scheduled" ? (
                      <a href={appt.meet_link} target="_blank" rel="noreferrer" className="text-olive-700 underline">
                        Abrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3">
                    {appt.status === "scheduled" ? (
                      <button
                        type="button"
                        disabled={cancellingId === appt.id}
                        onClick={() => cancelAppointment(appt.id)}
                        className="text-sm font-semibold text-rose-700 hover:underline disabled:opacity-50"
                      >
                        {cancellingId === appt.id ? "Cancelando..." : "Cancelar"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
