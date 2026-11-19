"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListOrdered, RefreshCw, Target, UserCheck } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import Badge from "@/components/ui/Badge";
import SmartTable from "@/components/ui/SmartTable";
import { Card, btnSecondary } from "@/components/layout/AppShell";
import { GOALS } from "@/lib/constants";

const PATIENT_FILTERS = [
  {
    key: "waitlist",
    label: "Fila de espera",
    icon: ListOrdered,
    options: [
      { value: "all", label: "Todos" },
      { value: "waiting", label: "Aguardando na fila" },
      { value: "called", label: "Chamados da fila" },
      { value: "none", label: "Fora da fila" }
    ],
    predicate: (row, value) =>
      value === "none" ? !row.waitlist_status : row.waitlist_status === value
  },
  {
    key: "account",
    label: "Conta",
    icon: UserCheck,
    options: [
      { value: "all", label: "Todas" },
      { value: "yes", label: "Com conta" },
      { value: "no", label: "Sem conta" }
    ],
    predicate: (row, value) => row.has_account === (value === "yes")
  },
  {
    key: "goal",
    label: "Objetivo",
    icon: Target,
    options: [{ value: "all", label: "Todos" }, ...GOALS.map((goal) => ({ value: goal, label: goal }))],
    predicate: (row, value) => row.goal === value
  }
];

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
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [waitlistStats, setWaitlistStats] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/patients");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPatients([]);
        setWaitlistStats(null);
        setLoadError(data.message || "Não foi possível carregar os pacientes.");
        return;
      }
      setPatients(data.patients || []);
      setWaitlistStats(data.waitlistStats || null);
    } catch {
      setPatients([]);
      setWaitlistStats(null);
      setLoadError("Falha de rede ao carregar pacientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/admin/waitlist/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setSyncMessage(data.message || (res.ok ? "Fila sincronizada." : "Falha ao sincronizar."));
      await loadPatients();
    } catch {
      setSyncMessage("Não foi possível sincronizar agora.");
    } finally {
      setSyncing(false);
    }
  }

  const withoutAccount =
    waitlistStats?.withoutAccount ??
    patients.filter((p) => p.from_waitlist && !p.has_account).length;
  const waitlistTotal = waitlistStats?.total ?? null;
  const unlinked = waitlistStats?.unlinked ?? 0;

  return (
    <AdminShell
      title="Pacientes"
      subtitle="Gerencie prontuários e acompanhamentos"
      breadcrumbs={["Admin", "Pacientes"]}
      userName="Letícia"
    >
      {withoutAccount > 0 || unlinked > 0 || waitlistTotal != null ? (
        <Card className="mb-4 border-amber-200 bg-amber-50/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 text-sm text-amber-950">
              {waitlistTotal != null ? (
                <p>
                  Fila de espera: <span className="font-semibold">{waitlistTotal}</span> pessoa
                  {waitlistTotal === 1 ? "" : "s"}
                  {withoutAccount > 0 ? (
                    <>
                      {" "}
                      · <span className="font-semibold">{withoutAccount}</span> ainda sem conta na
                      plataforma
                    </>
                  ) : null}
                  .
                </p>
              ) : (
                <p>
                  <span className="font-semibold">{withoutAccount}</span>{" "}
                  {withoutAccount === 1
                    ? "pessoa da fila de espera ainda não criou conta"
                    : "pessoas da fila de espera ainda não criaram conta"}
                  .
                </p>
              )}
              {unlinked > 0 ? (
                <p className="mt-1 text-amber-900/80">
                  {unlinked} cadastro{unlinked === 1 ? "" : "s"} da fila ainda não aparecia
                  {unlinked === 1 ? "" : "m"} em pacientes — use sincronizar para importar.
                </p>
              ) : null}
              <p className="mt-1 text-xs text-amber-900/65">
                Os dados originais permanecem na tabela <code className="text-[11px]">waitlist</code>{" "}
                no Supabase.
              </p>
              {syncMessage ? (
                <p className="mt-2 text-xs font-medium text-amber-900">{syncMessage}</p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={syncing}
              onClick={handleSync}
              className={`${btnSecondary("!border-amber-300 !bg-white !text-amber-950 shrink-0")} disabled:opacity-60`}
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} strokeWidth={2} />
              {syncing ? "Sincronizando..." : "Sincronizar fila"}
            </button>
          </div>
        </Card>
      ) : null}
      {loadError ? (
        <Card className="mb-4 border-rose-200 bg-rose-50/80">
          <p className="text-sm text-rose-900">{loadError}</p>
        </Card>
      ) : null}

      <Card title="Lista de pacientes">
        <SmartTable
          rows={patients}
          loading={loading}
          itemLabel={["paciente", "pacientes"]}
          searchPlaceholder="Nome, telefone ou objetivo"
          searchFields={(row) => [row.full_name, row.phone, row.goal, row.cpf_masked]}
          filters={PATIENT_FILTERS}
          defaultSort={{ key: "created", dir: "desc" }}
          emptyMessage={loadError ? "Não foi possível carregar a lista." : "Nenhum paciente cadastrado."}
          noResultsMessage="Nenhum paciente com esses filtros."
          onRowDoubleClick={(row) => router.push(`/admin/pacientes/${row.id}`)}
          columns={[
            {
              key: "name",
              label: "Nome",
              mobile: "title",
              sortValue: (row) => row.full_name,
              sortLabels: ["A–Z", "Z–A"],
              render: (row) => (
                <Link
                  href={`/admin/pacientes/${row.id}`}
                  className="font-medium text-graphite underline-offset-2 hover:text-olive-800 hover:underline"
                >
                  {row.full_name}
                </Link>
              )
            },
            {
              key: "waitlist",
              label: "Fila",
              mobile: "badges",
              sortValue: (row) => row.waitlist_position ?? null,
              sortLabels: ["1º primeiro", "último primeiro"],
              render: (row) =>
                row.waitlist_position ? (
                  <Badge variant="warning" className="whitespace-nowrap">
                    {row.waitlist_position}º na fila
                  </Badge>
                ) : row.waitlist_status === "called" ? (
                  <Badge variant="success">Chamada</Badge>
                ) : (
                  <span className="hidden text-graphite/35 xl:inline">—</span>
                )
            },
            {
              key: "phone",
              label: "WhatsApp",
              nowrap: true,
              render: (row) => formatPhone(row.phone)
            },
            { key: "goal", label: "Objetivo", sortValue: (row) => row.goal, sortLabels: ["A–Z", "Z–A"] },
            {
              key: "account",
              label: "Conta",
              render: (row) =>
                row.has_account ? <Badge variant="success">Ativa</Badge> : <Badge variant="neutral">Sem conta</Badge>
            },
            { key: "cpf_masked", label: "CPF", nowrap: true, render: (row) => row.cpf_masked || "—" },
            {
              key: "created",
              label: "Cadastro",
              nowrap: true,
              sortValue: (row) => {
                const date = row.registered_at || row.created_at;
                return date ? new Date(date).getTime() : null;
              },
              sortLabels: ["mais antigos", "mais recentes"],
              render: (row) => {
                const date = row.registered_at || row.created_at;
                return date ? new Date(date).toLocaleDateString("pt-BR") : "—";
              }
            },
            {
              key: "actions",
              label: "",
              mobile: "actions",
              render: (row) => (
                <Link href={`/admin/pacientes/${row.id}`} className="font-semibold text-olive-700 hover:text-olive-800">
                  Abrir
                </Link>
              )
            }
          ]}
        />
      </Card>
    </AdminShell>
  );
}
