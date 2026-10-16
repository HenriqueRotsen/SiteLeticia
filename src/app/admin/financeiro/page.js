"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, Clock3, FileWarning } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { paymentBadge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import { labelPaymentDocType } from "@/lib/labels";

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function AdminFinanceiroPage() {
  const [month, setMonth] = useState(currentMonthValue);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/finance?month=${month}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [month]);

  const summary = data?.summary || {};
  const appointments = data?.appointments || [];

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }, [month]);

  return (
    <AdminShell
      title="Financeiro"
      subtitle={`Faturamento · ${monthLabel}`}
      breadcrumbs={["Admin", "Financeiro"]}
      userName="Letícia"
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-graphite/70">
          Mês
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="mt-1 block rounded-xl border border-olive-900/10 bg-white px-3 py-2 text-sm"
          />
        </label>
        <Link href="/admin/consultas" className="text-sm font-medium text-olive-800 hover:underline">
          Ir para consultas
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Faturamento validado"
          value={formatCurrency(summary.revenueCents || 0)}
          hint={`${summary.paidCount || 0} consultas pagas`}
          icon={CircleDollarSign}
          tone="olive"
        />
        <StatCard
          label="Aguardando validação"
          value={summary.pendingValidationCount || 0}
          hint="Com comprovante enviado"
          icon={Clock3}
          tone="amber"
          href="/admin/consultas"
        />
        <StatCard
          label="Valores divergentes"
          value={summary.mismatchCount || 0}
          hint="NF ou comprovante ≠ consulta"
          icon={FileWarning}
          tone="sand"
        />
      </div>

      <Card className="mt-6" title="Consultas do período">
        {loading ? (
          <p className="text-sm text-graphite/55">Carregando...</p>
        ) : !appointments.length ? (
          <p className="text-sm text-graphite/55">Nenhuma consulta neste mês.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-graphite/50">
                  <th className="py-2">Paciente</th>
                  <th className="py-2">Data</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Documentos</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => {
                  const badge = paymentBadge(appt.payment_status);
                  const docs = appt.documents || [];
                  return (
                    <tr key={appt.id} className="border-t border-olive-900/5">
                      <td className="py-3">{appt.patients?.full_name || "—"}</td>
                      <td className="py-3">{new Date(appt.starts_at).toLocaleString("pt-BR")}</td>
                      <td className="py-3">{formatCurrency(appt.amount_cents)}</td>
                      <td className="py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1">
                          {docs.length
                            ? docs.map((doc) => (
                                <span key={doc.id} className="text-xs text-graphite/60">
                                  {labelPaymentDocType(doc.doc_type)}
                                  {doc.amount_matches === false ? " · divergente" : ""}
                                  {doc.url ? (
                                    <>
                                      {" · "}
                                      <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-olive-800 hover:underline"
                                      >
                                        ver
                                      </a>
                                    </>
                                  ) : null}
                                </span>
                              ))
                            : "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
