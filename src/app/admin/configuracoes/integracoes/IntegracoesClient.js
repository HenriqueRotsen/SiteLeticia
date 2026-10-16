"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";
import { Card } from "@/components/layout/AppShell";

export default function IntegracoesPage() {
  const searchParams = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [connectedAt, setConnectedAt] = useState(null);

  async function loadStatus() {
    const res = await fetch("/api/admin/integrations/google-calendar");
    const data = await res.json();
    setConnected(data.connected);
    setConnectedAt(data.connection?.connected_at);
  }

  useEffect(() => {
    loadStatus();
  }, []);

  async function disconnect() {
    await fetch("/api/admin/integrations/google-calendar", { method: "DELETE" });
    loadStatus();
  }

  const error = searchParams.get("error");
  const success = searchParams.get("connected");

  return (
    <AdminShell title="Integrações" breadcrumbs={["Admin", "Configurações", "Integrações"]} userName="Letícia">
      {error ? (
        <Card className="mb-4 border-red-200 bg-red-50 text-red-900">
          Não foi possível conectar o Google Calendar.
        </Card>
      ) : null}
      {success ? (
        <Card className="mb-4 border-olive-200 bg-olive-50 text-olive-900">Google Calendar conectado.</Card>
      ) : null}

      <Card>
        <h2 className="font-semibold">Google Calendar + Meet</h2>
        <p className="mt-2 text-sm text-graphite/70">
          Ao agendar consultas, cria evento de 60 min com Google Meet e convite por e-mail para o paciente.
        </p>
        <p className="mt-3 text-sm">
          Status: {connected ? `Conectado${connectedAt ? ` em ${new Date(connectedAt).toLocaleString("pt-BR")}` : ""}` : "Não conectado"}
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="/api/auth/google/calendar"
            className="rounded-xl bg-olive-700 px-4 py-2 text-sm font-semibold text-white"
          >
            {connected ? "Reconectar" : "Conectar Google"}
          </a>
          {connected ? (
            <button type="button" onClick={disconnect} className="rounded-xl border px-4 py-2 text-sm">
              Desconectar
            </button>
          ) : null}
        </div>
      </Card>
    </AdminShell>
  );
}
