"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { Card } from "@/components/layout/AppShell";
import Badge, { appointmentBadge } from "@/components/ui/Badge";

export default function AdminAgendaPage() {
  const [appointments, setAppointments] = useState([]);
  const [cancellingId, setCancellingId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    setAppointments(data.appointments || []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function cancelAppointment(appointmentId) {
    if (!window.confirm("Cancelar esta consulta?")) return;
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
      return;
    }
    setFeedback("Consulta cancelada.");
    await load();
  }

  return (
    <AdminShell title="Agenda" breadcrumbs={["Admin", "Agenda"]} userName="Letícia">
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
                  <td className="py-3">{appt.patients?.full_name}</td>
                  <td className="py-3">{new Date(appt.starts_at).toLocaleString("pt-BR")}</td>
                  <td className="py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
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
