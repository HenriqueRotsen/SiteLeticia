"use client";

import { useEffect, useState } from "react";
import PatientShell from "@/components/layout/PatientShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";

export default function ConsultasPage() {
  const [appointments, setAppointments] = useState([]);
  const [payment, setPayment] = useState({ settings: {}, methods: [] });

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/payment-info").then((r) => r.json())
    ]).then(([a, p]) => {
      setAppointments(a.appointments || []);
      setPayment(p);
    });
  }, []);

  return (
    <PatientShell title="Minhas consultas" breadcrumbs={["Paciente", "Consultas"]}>
      {!appointments.length ? (
        <Card>
          <p className="text-graphite/70">Você ainda não tem consultas.</p>
        </Card>
      ) : (
        appointments.map((appt) => {
          const statusBadge = appointmentBadge(appt.status);
          const payBadge = paymentBadge(appt.payment_status);

          return (
            <Card key={appt.id} className="mb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{new Date(appt.starts_at).toLocaleString("pt-BR")}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                    <Badge variant={payBadge.variant}>{payBadge.label}</Badge>
                  </div>
                  <p className="mt-2 text-sm">{formatCurrency(appt.amount_cents)}</p>
                </div>
                {appt.meet_link ? (
                  <a
                    href={appt.meet_link}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-olive-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Entrar no Meet
                  </a>
                ) : null}
              </div>
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
