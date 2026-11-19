"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import Badge from "@/components/ui/Badge";
import { Card, DataTable, btnSecondary, inputClassName } from "@/components/layout/AppShell";

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
  const [q, setQ] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [onlyWaitlist, setOnlyWaitlist] = useState(false);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/admin/patients?${params.toString()}`);
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
  }, [q]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients();
    }, q ? 250 : 0);
    return () => clearTimeout(timer);
  }, [loadPatients, q]);

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

  // Na visão "Só fila de espera", a ordem é a da fila (1º, 2º, …).
  const rows = useMemo(() => {
    if (!onlyWaitlist) return patients;
    return patients
      .filter((p) => p.waitlist_status === "waiting")
      .sort((a, b) => a.waitlist_position - b.waitlist_position);
  }, [patients, onlyWaitlist]);

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
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filtrar pacientes">
          {[
            { value: false, label: "Todos" },
            { value: true, label: "Só fila de espera" }
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={onlyWaitlist === option.value}
              onClick={() => setOnlyWaitlist(option.value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                onlyWaitlist === option.value
                  ? "border-olive-700 bg-olive-700 text-white"
                  : "border-olive-900/10 bg-white text-graphite/70 hover:border-olive-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </Card>
      {loadError ? (
        <Card className="mb-4 border-rose-200 bg-rose-50/80">
          <p className="text-sm text-rose-900">{loadError}</p>
        </Card>
      ) : null}

      <Card title="Lista de pacientes">
        <DataTable
          emptyMessage={
            loading
              ? "Carregando pacientes..."
              : loadError
                ? "Não foi possível carregar a lista."
                : onlyWaitlist
                  ? "Ninguém aguardando na fila com esse filtro."
                  : "Nenhum paciente encontrado."
          }
          columns={[
            {
              key: "name",
              label: "Nome",
              render: (row) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/pacientes/${row.id}`} className="font-medium text-graphite underline-offset-2 hover:text-olive-800 hover:underline">
                    {row.full_name}
                  </Link>
                  {!row.has_account ? <Badge variant="neutral">Sem conta</Badge> : null}
                </div>
              )
            },
            {
              key: "waitlist",
              label: "Fila",
              render: (row) =>
                row.waitlist_position ? (
                  <Badge variant="warning" className="whitespace-nowrap">{row.waitlist_position}º na fila</Badge>
                ) : row.waitlist_status === "called" ? (
                  <Badge variant="success">Chamada</Badge>
                ) : (
                  <span className="text-graphite/35">—</span>
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
          rows={rows}
          onRowDoubleClick={(row) => router.push(`/admin/pacientes/${row.id}`)}
        />
      </Card>
    </AdminShell>
  );
}
