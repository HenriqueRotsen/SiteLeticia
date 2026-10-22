"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/layout/AppShell";

export default function BookingToggleCard({ onFeedback, onError, className = "mb-6" }) {
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/booking-settings");
    const data = await res.json().catch(() => ({}));
    setBookingEnabled(data.bookingEnabled !== false);
    setLoaded(true);
    if (data.needsMigration) {
      onError?.(data.message || "Rode a migration de booking no Supabase.");
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBooking(nextValue) {
    setSaving(true);
    onFeedback?.("");
    onError?.("");
    const res = await fetch("/api/admin/booking-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingEnabled: nextValue })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      onError?.(data.message || "Não foi possível atualizar a marcação de consultas.");
      return;
    }

    setBookingEnabled(data.bookingEnabled !== false);
    onFeedback?.(
      data.bookingEnabled !== false
        ? "Marcação de consultas ativada. Pacientes já podem agendar."
        : "Marcação de consultas desativada. Pacientes não conseguem agendar novos horários."
    );
  }

  return (
    <Card className={className}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-graphite">Marcação de consultas</h2>
          <p className="mt-1 text-sm text-graphite/60">
            {!loaded
              ? "Carregando…"
              : bookingEnabled
                ? "Pacientes podem escolher horários e agendar pela plataforma."
                : "Pacientes não conseguem marcar novos horários até você reativar."}
          </p>
        </div>
        <button
          type="button"
          disabled={saving || !loaded}
          onClick={() => toggleBooking(!bookingEnabled)}
          className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition ${
            bookingEnabled ? "bg-olive-700" : "bg-graphite/25"
          } disabled:opacity-60`}
          aria-pressed={bookingEnabled}
          aria-label={bookingEnabled ? "Desativar marcação" : "Ativar marcação"}
        >
          <span
            className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition ${
              bookingEnabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-graphite/45">
        Status: {!loaded ? "…" : bookingEnabled ? "Ativada" : "Desativada"}
      </p>
    </Card>
  );
}
