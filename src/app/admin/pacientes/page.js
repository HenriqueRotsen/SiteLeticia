"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

  const loadPatients = useCallback(async ({ sync = false } = {}) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sync) params.set("sync", "1");
    const res = await fetch(`/api/admin/patients?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    setPatients(data.patients || []);
    setWaitlistStats(data.waitlistStats || null);
    if (data.sync?.message || (sync && data.sync)) {
      setSyncMessage(
        data.sync?.message ||
          `Sincronizado: ${data.sync?.created || 0} novos, ${data.sync?.linked || 0} vinculados.`
      );
    }
  }, [q]);

  useEffect(() => {
    loadPatients({ sync: true });
  }, [loadPatients]);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const res = await fetch("/api/admin/waitlist/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setSyncMessage(data.message || (res.ok ? "Fila sincronizada." : "Falha ao sincronizar."));
      await loadPatients({ sync: false });
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
          onRowDoubleClick={(row) => router.push(`/admin/pacientes/${row.id}`)}
        />
      </Card>
    </AdminShell>
  );
}
