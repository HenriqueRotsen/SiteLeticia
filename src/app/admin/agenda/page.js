"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { Card } from "@/components/layout/AppShell";
import Badge, { appointmentBadge } from "@/components/ui/Badge";

export default function AdminAgendaPage() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch("/api/admin/appointments")
      .then((r) => r.json())
      .then((d) => setAppointments(d.appointments || []));
  }, []);

  return (
    <AdminShell title="Agenda" breadcrumbs={["Admin", "Agenda"]} userName="Letícia">
      <Card>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-graphite/50">
              <th className="py-2">Paciente</th>
              <th className="py-2">Horário</th>
              <th className="py-2">Status</th>
              <th className="py-2">Meet</th>
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
                    {appt.meet_link ? (
                      <a href={appt.meet_link} target="_blank" rel="noreferrer" className="text-olive-700 underline">
                        Abrir
                      </a>
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
