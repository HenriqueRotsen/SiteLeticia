"use client";

import { useEffect, useState } from "react";
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
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";

export default function EvolucaoPage() {
  const [measurements, setMeasurements] = useState([]);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/patients/me/measurements").then((r) => r.json()),
      fetch("/api/patients/me/insights").catch(() => ({ insights: [] }))
    ]).then(([m, i]) => {
      setMeasurements(
        (m.measurements || []).map((row) => ({
          date: new Date(row.recorded_at).toLocaleDateString("pt-BR"),
          peso: Number(row.weight_kg)
        }))
      );
      setInsights(i.insights || []);
    });
  }, []);

  return (
    <PatientShell
      title="Evolução"
      subtitle="Acompanhe peso e insights ao longo do tempo"
      breadcrumbs={["Paciente", "Evolução"]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Peso ao longo do tempo">
          <div className="h-72">
            {measurements.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={measurements}>
                  <defs>
                    <linearGradient id="pesoFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f2819" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#4f2819" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f2eee4" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#252824", fontSize: 12, opacity: 0.45 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#252824", fontSize: 12, opacity: 0.45 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(79, 40, 25, 0.12)",
                      boxShadow: "0 8px 24px rgba(37, 40, 36, 0.08)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="peso"
                    stroke="#4f2819"
                    strokeWidth={2.5}
                    fill="url(#pesoFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-16 text-center text-sm text-graphite/45">Sem medições registradas.</p>
            )}
          </div>
        </Card>
        <Card title="Insights">
          <div className="space-y-3">
            {insights.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-xl border border-olive-900/10 bg-linen p-4">
                <p className="text-sm font-semibold text-graphite">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-graphite/60">{item.body}</p>
              </div>
            ))}
            {!insights.length ? (
              <p className="text-sm text-graphite/45">Insights aparecerão conforme seus dados forem registrados.</p>
            ) : null}
          </div>
        </Card>
      </div>
    </PatientShell>
  );
}
