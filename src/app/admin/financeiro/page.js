"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, Clock3, FileText, FileWarning } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, formatCurrency } from "@/components/layout/AppShell";
import Badge, { paymentBadge } from "@/components/ui/Badge";
import StatCard from "@/components/ui/StatCard";
import SmartTable from "@/components/ui/SmartTable";
import { appointmentSearchFields, dateSort, paymentFilter } from "@/components/ui/appointmentTable";
import { formatAppointmentDateTime } from "@/lib/datetime";
import { PAYMENT_STATUS_LABELS, labelPaymentDocType } from "@/lib/labels";

const FILTERS = [
  paymentFilter,
  {
    key: "documents",
    label: "Documentos",
    icon: FileText,
    options: [
      { value: "all", label: "Todos" },
      { value: "with", label: "Com documento" },
      { value: "without", label: "Sem documento" },
      { value: "mismatch", label: "Valor divergente" }
    ],
    predicate: (row, value) => {
      const docs = row.documents || [];
      if (value === "with") return docs.length > 0;
      if (value === "without") return docs.length === 0;
      if (value === "mismatch") return docs.some((doc) => doc.amount_matches === false);
      return true;
    }
  }
];

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
        <SmartTable
          key={month}
          rows={appointments}
          loading={loading}
          itemLabel={["consulta", "consultas"]}
          searchPlaceholder="Paciente, telefone ou data"
          searchFields={(row) => appointmentSearchFields(row, { includePatient: true })}
          filters={FILTERS}
          defaultSort={{ key: "starts_at", dir: "desc" }}
          emptyMessage="Nenhuma consulta neste mês."
          noResultsMessage="Nenhuma consulta com esses filtros."
          columns={[
            {
              key: "patient",
              label: "Paciente",
              mobile: "title",
              sortValue: (row) => row.patients?.full_name,
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => (
                <Link
                  href={`/admin/pacientes/${row.patient_id}`}
                  className="font-medium text-graphite underline-offset-2 hover:text-olive-800 hover:underline"
                >
                  {row.patients?.full_name || "—"}
                </Link>
              )
            },
            {
              key: "starts_at",
              label: "Data",
              mobile: "subtitle",
              nowrap: true,
              ...dateSort,
              render: (row) => (
                <Link href={`/admin/consultas/${row.id}`} className="underline-offset-2 hover:text-olive-800 hover:underline">
                  {formatAppointmentDateTime(row.starts_at)}
                </Link>
              )
            },
            {
              key: "amount",
              label: "Valor",
              nowrap: true,
              sortValue: (row) => Number(row.amount_cents) || 0,
              sortLabels: ["menor", "maior"],
              render: (row) => (
                <span>
                  {formatCurrency(row.amount_cents)}
                  <span className="block text-[11px] text-graphite/45">
                    {row.patient_package_id ? "Pacote" : row.payment_method === "card" ? "Cartão" : "PIX"}
                  </span>
                </span>
              )
            },
            {
              key: "payment",
              label: "Status",
              mobile: "badges",
              sortValue: (row) => PAYMENT_STATUS_LABELS[row.payment_status],
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => {
                const badge = paymentBadge(row.payment_status);
                return <Badge variant={badge.variant}>{badge.label}</Badge>;
              }
            },
            {
              key: "documents",
              label: "Documentos",
              render: (row) => {
                const docs = row.documents || [];
                if (!docs.length) return "—";
                return (
                  <div className="flex flex-col gap-1">
                    {docs.map((doc) => (
                      <span key={doc.id} className="text-xs text-graphite/60">
                        {labelPaymentDocType(doc.doc_type)}
                        {doc.amount_matches === false ? <span className="text-amber-800"> · divergente</span> : ""}
                        {doc.url ? (
                          <>
                            {" · "}
                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-olive-800 hover:underline">
                              ver
                            </a>
                          </>
                        ) : null}
                      </span>
                    ))}
                  </div>
                );
              }
            }
          ]}
        />
      </Card>
    </AdminShell>
  );
}
