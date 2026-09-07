"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { CalendarDays, FlaskConical, Users } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, DataTable, formatCurrency } from "@/components/layout/AppShell";
import Badge, { appointmentBadge, paymentBadge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function buildWeeklyChart(appointments) {
  const counts = Array.from({ length: 7 }, (_, index) => ({
    day: weekdayLabels[index],
    consultas: 0
  }));

  for (const appt of appointments || []) {
    const day = new Date(appt.starts_at).getDay();
    counts[day].consultas += 1;
  }

  return counts;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState({ stats: {}, upcoming: [] });

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const chartData = useMemo(() => buildWeeklyChart(data.upcoming), [data.upcoming]);
  const occupancy = Math.min(
    100,
    Math.round(((data.stats?.appointmentsToday || 0) / 6) * 100)
  );

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Visão geral do consultório"
      breadcrumbs={["Admin", "Dashboard"]}
      userName="Letícia"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Pacientes ativos"
          value={data.stats?.patients || 0}
          hint="Cadastrados na plataforma"
          icon={Users}
          tone="olive"
        />
        <StatCard
          label="Consultas hoje"
          value={data.stats?.appointmentsToday || 0}
          hint="Agenda do dia"
          icon={CalendarDays}
          tone="sand"
        />
        <StatCard
          label="Exames pendentes"
          value={data.stats?.pendingLabs || 0}
          hint="Aguardando revisão"
          icon={FlaskConical}
          tone="amber"
          href="/admin/exames"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Consultas na semana">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="consultasFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f2819" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#4f2819" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f2eee4" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#252824", fontSize: 12, opacity: 0.45 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#252824", fontSize: 12, opacity: 0.45 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(79, 40, 25, 0.12)",
                    boxShadow: "0 8px 24px rgba(37, 40, 36, 0.08)"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="consultas"
                  stroke="#4f2819"
                  strokeWidth={2.5}
                  fill="url(#consultasFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-2" title="Ocupação da agenda">
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#f2eee4" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke="#4f2819"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${occupancy * 3.01} 301`}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-semibold text-graphite">{occupancy}%</p>
                <p className="text-xs text-graphite/45">slots usados</p>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-graphite/55">
              {data.stats?.appointmentsToday || 0} consultas confirmadas para hoje
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-6" title="Próximas consultas">
        <DataTable
          emptyMessage="Nenhuma consulta agendada."
          columns={[
            {
              key: "patient",
              label: "Paciente",
              render: (row) => (
                <span className="font-medium text-graphite">{row.patients?.full_name || "—"}</span>
              )
            },
            {
              key: "when",
              label: "Data e hora",
              render: (row) => new Date(row.starts_at).toLocaleString("pt-BR")
            },
            {
              key: "status",
              label: "Status",
              render: (row) => {
                const badge = appointmentBadge(row.status);
                return <Badge variant={badge.variant}>{badge.label}</Badge>;
              }
            },
            {
              key: "payment",
              label: "Pagamento",
              render: (row) => {
                const badge = paymentBadge(row.payment_status);
                return <Badge variant={badge.variant}>{badge.label}</Badge>;
              }
            },
            {
              key: "amount",
              label: "Valor",
              render: (row) => formatCurrency(row.amount_cents)
            }
          ]}
          rows={(data.upcoming || []).map((appt) => ({ ...appt, id: appt.id }))}
        />
        <div className="mt-4 border-t border-olive-900/10 pt-4">
          <Link href="/admin/consultas" className="text-sm font-semibold text-olive-700 hover:text-olive-800">
            Ver todas as consultas →
          </Link>
        </div>
      </Card>
    </AdminShell>
  );
}
