"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import Badge from "@/components/ui/Badge";
import { Card, DataTable, inputClassName } from "@/components/layout/AppShell";

function formatPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`/api/admin/patients?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setPatients(d.patients || []));
  }, [q]);

  const waitlistCount = patients.filter((p) => p.from_waitlist && !p.has_account).length;

  return (
    <AdminShell
      title="Pacientes"
      subtitle="Gerencie prontuários e acompanhamentos"
      breadcrumbs={["Admin", "Pacientes"]}
      userName="Letícia"
    >
      {waitlistCount > 0 ? (
        <Card className="mb-4 border-amber-200 bg-amber-50/80">
          <p className="text-sm text-amber-950">
            <span className="font-semibold">{waitlistCount}</span>{" "}
            {waitlistCount === 1 ? "pessoa da fila de espera ainda não criou conta" : "pessoas da fila de espera ainda não criaram conta"}.
            Os dados originais permanecem na tabela <code className="text-xs">waitlist</code> no Supabase.
          </p>
        </Card>
      ) : null}
      <Card className="mb-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className={inputClassName("pl-9")}
          />
        </label>
      </Card>
      <Card title="Lista de pacientes">
        <DataTable
          emptyMessage="Nenhum paciente encontrado."
          columns={[
            {
              key: "name",
              label: "Nome",
              render: (row) => (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-graphite">{row.full_name}</span>
                  {row.from_waitlist ? <Badge variant="warning">Fila de espera</Badge> : null}
                  {!row.has_account ? <Badge variant="neutral">Sem conta</Badge> : null}
                </div>
              )
            },
            {
              key: "phone",
              label: "WhatsApp",
              render: (row) => formatPhone(row.phone)
            },
            { key: "cpf_masked", label: "CPF" },
            { key: "goal", label: "Objetivo" },
            {
              key: "actions",
              label: "Ações",
              render: (row) => (
                <Link
                  href={`/admin/pacientes/${row.id}`}
                  className="font-semibold text-olive-700 hover:text-olive-800"
                >
                  Abrir
                </Link>
              )
            }
          ]}
          rows={patients.map((p) => ({ ...p, id: p.id }))}
        />
      </Card>
    </AdminShell>
  );
}
