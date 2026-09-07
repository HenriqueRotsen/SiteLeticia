"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { paymentBadge } from "@/components/ui/Badge";

export default function AdminConsultasPage() {
  const [appointments, setAppointments] = useState([]);

  async function load() {
    const res = await fetch("/api/admin/appointments");
    const data = await res.json();
    setAppointments(data.appointments || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updatePayment(id, paymentStatus) {
    await fetch(`/api/admin/appointments/${id}/payment`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus })
    });
    load();
  }

  return (
    <AdminShell title="Consultas" breadcrumbs={["Admin", "Consultas"]} userName="Letícia">
      <Card>
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

              return (
                <tr key={appt.id} className="border-t border-olive-900/5">
                  <td className="py-3">{appt.patients?.full_name}</td>
                  <td className="py-3">{new Date(appt.starts_at).toLocaleString("pt-BR")}</td>
                  <td className="py-3">{formatCurrency(appt.amount_cents)}</td>
                  <td className="py-3">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </td>
                  <td className="py-3 space-x-2">
                    <button type="button" onClick={() => updatePayment(appt.id, "paid")} className="text-olive-700">
                      Marcar pago
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePayment(appt.id, "pending")}
                      className="text-graphite/60"
                    >
                      Marcar pendente
                    </button>
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
