"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Sparkles, Video } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import WaitlistPositionCard from "@/components/waitlist/WaitlistPositionCard";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import { paymentBadge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { usePatientProfile } from "@/lib/hooks/usePatientProfile";

export default function PatientHomePage() {
  const { firstName } = usePatientProfile();
  const [data, setData] = useState({ appointments: [], insights: [], waitlist: null });
  const [waitlistLoading, setWaitlistLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments").then((r) => r.json()),
      fetch("/api/patients/me/insights").then((r) => r.json()),
      fetch("/api/patients/me").then((r) => (r.ok ? r.json() : { waitlist: null }))
    ])
      .then(([appts, insightsRes, profileRes]) => {
        setData({
          appointments: appts.appointments?.filter((a) => a.status === "scheduled") || [],
          insights: insightsRes.insights || [],
          waitlist: profileRes.waitlist || null
        });
      })
      .finally(() => {
        setWaitlistLoading(false);
      });
  }, []);

  const next = data.appointments.find((a) => new Date(a.starts_at) >= new Date());
  const payment = next ? paymentBadge(next.payment_status) : null;

  return (
    <PatientShell
      title={firstName ? `Olá, ${firstName}` : "Olá"}
      subtitle="Acompanhe sua jornada nutricional"
      breadcrumbs={["Paciente", "Início"]}
    >
      <WaitlistPositionCard waitlist={data.waitlist} loading={waitlistLoading} />

      {next ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-olive-200/80 bg-gradient-to-r from-olive-700 to-olive-800 p-6 text-white shadow-card sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-olive-100">Próxima consulta</p>
              <p className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {new Date(next.starts_at).toLocaleString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {payment ? (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                    Pagamento: {payment.label}
                  </span>
                ) : null}
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
                  {formatCurrency(next.amount_cents)}
                </span>
              </div>
            </div>
            {next.meet_link ? (
              <a
                href={next.meet_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-olive-800 transition hover:bg-olive-50"
              >
                <Video className="h-4 w-4" />
                Entrar no Meet
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Consultas agendadas"
          value={data.appointments.length}
          hint="Próximas sessões"
          icon={Calendar}
          tone="olive"
        />
        <StatCard
          label="Insights"
          value={data.insights.length || 0}
          hint="Recomendações personalizadas"
          icon={Sparkles}
          tone="linen"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Insight da semana">
          {data.insights[0] ? (
            <div className="rounded-xl bg-linen p-4">
              <p className="font-semibold text-graphite">{data.insights[0].title}</p>
              <p className="mt-2 text-sm leading-6 text-graphite/65">{data.insights[0].body}</p>
            </div>
          ) : (
            <p className="text-sm text-graphite/45">Sem insights ainda. Continue registrando sua evolução.</p>
          )}
        </Card>

        <Card title="Acesso rápido">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: "/app/dieta", label: "Ver dieta" },
              { href: "/app/agenda", label: "Agendar consulta" },
              { href: "/app/exames", label: "Meus exames" },
              { href: "/app/evolucao", label: "Ver evolução" }
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center justify-between rounded-xl border border-olive-900/10 px-4 py-3 text-sm font-medium text-graphite/75 transition hover:border-olive-300 hover:bg-olive-50/60 hover:text-olive-800"
              >
                {item.label}
                <ArrowRight className="h-4 w-4 text-graphite/35" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </PatientShell>
  );
}
