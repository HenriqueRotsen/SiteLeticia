"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, FlaskConical, LineChart, Salad, Sparkles, Video } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import WaitlistPositionCard from "@/components/waitlist/WaitlistPositionCard";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import { paymentBadge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { usePatientProfile } from "@/lib/hooks/usePatientProfile";

function insightHref(title) {
  const text = String(title || "").toLowerCase();
  if (text.includes("consulta")) return "/app/consultas";
  if (text.includes("exame")) return "/app/exames";
  if (text.includes("dieta") || text.includes("plano") || text.includes("adesão")) return "/app/dieta";
  if (text.includes("peso") || text.includes("evolução")) return "/app/evolucao";
  return "/app/evolucao";
}

function insightIcon(title) {
  const text = String(title || "").toLowerCase();
  if (text.includes("consulta")) return Calendar;
  if (text.includes("exame")) return FlaskConical;
  if (text.includes("dieta") || text.includes("plano") || text.includes("adesão")) return Salad;
  if (text.includes("peso") || text.includes("evolução")) return LineChart;
  return Sparkles;
}

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
  const highlights = data.insights.slice(0, 3);

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
            <div className="flex min-w-0 flex-col items-start">
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
              <p className="mt-3">
                {payment ? (
                  <span className="mr-2 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                    Pagamento: {payment.label}
                  </span>
                ) : null}
                <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  {formatCurrency(next.amount_cents)}
                </span>
              </p>
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

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard
          label="Consultas agendadas"
          value={data.appointments.length}
          hint="Próximas sessões"
          icon={Calendar}
          tone="olive"
          href="/app/consultas"
        />

        <section className="rounded-2xl border border-olive-900/10 bg-porcelain/95 p-5 shadow-card lg:col-span-2 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#BD9B72]" strokeWidth={1.75} />
              <h2 className="text-base font-semibold text-graphite">Destaques</h2>
            </div>
            <Link href="/app/evolucao" className="text-xs font-semibold text-[#BD9B72] hover:underline">
              Ver todos →
            </Link>
          </div>

          {highlights.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {highlights.map((item) => {
                const Icon = insightIcon(item.title);
                const href = insightHref(item.title);
                return (
                  <Link
                    key={item.id || item.title}
                    href={href}
                    className="group flex gap-3 rounded-xl bg-linen p-4 transition hover:bg-[#BD9B72]/12 hover:ring-1 hover:ring-[#BD9B72]/30"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#BD9B72] shadow-sm">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-graphite group-hover:text-[#BD9B72]">
                        {item.title}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-sm leading-5 text-graphite/60">
                        {item.body}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-graphite/45">
              Os destaques aparecem conforme consultas, dieta e evolução forem registrados.
            </p>
          )}
        </section>
      </div>

      <div className="mt-6">
        <Card title="Acesso rápido">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
