"use client";

// Agenda por mês para a Letícia: escolhe o mês, vê quantos horários abrem em cada dia,
// bloqueia dias ou períodos (férias, "só atendo a partir de 20/01") e libera de novo.

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarOff, Trash2 } from "lucide-react";
import { Card, btnPrimary, inputClassName } from "@/components/layout/AppShell";
import MonthCalendar from "@/components/ui/MonthCalendar";
import { useDialog } from "@/components/ui/ConfirmDialog";
import { TIMEZONE } from "@/lib/constants";
import {
  BOOKING_HORIZON_DAYS,
  blockedDayKeys,
  dayRangeIso,
  formatDayKey,
  monthKeyOf,
  monthRangeIso
} from "@/lib/scheduling/month";
import { zonedDateKey } from "@/lib/scheduling/timezone";

function blockLabel(block) {
  const from = zonedDateKey(new Date(block.starts_at), TIMEZONE);
  const lastMoment = new Date(new Date(block.ends_at).getTime() - 1);
  const to = zonedDateKey(lastMoment, TIMEZONE);
  return from === to ? formatDayKey(from) : `${formatDayKey(from)} a ${formatDayKey(to)}`;
}

export default function AvailabilityMonthCard({ version = 0, onFeedback, onError }) {
  const { confirm } = useDialog();
  const today = zonedDateKey(new Date(), TIMEZONE);
  const currentMonth = monthKeyOf(new Date());
  const maxMonth = monthKeyOf(new Date(Date.now() + BOOKING_HORIZON_DAYS * 86_400_000));
  const [month, setMonth] = useState(currentMonth);
  const [slots, setSlots] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ from: "", to: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const loadBlocks = useCallback(async () => {
    const res = await fetch("/api/admin/availability");
    const data = await res.json().catch(() => ({}));
    setBlocks(data.blocks || []);
  }, []);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks, version, refresh]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const { startsAt, endsAt } = monthRangeIso(month);
    fetch(`/api/admin/availability/preview?from=${startsAt}&to=${endsAt}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(data.slots || []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [month, version, refresh]);

  const counts = useMemo(() => {
    const map = new Map();
    for (const slot of slots) {
      const key = zonedDateKey(new Date(slot.startsAt), TIMEZONE);
      map.set(key, (map.get(key) || 0) + 1);
    }
    return map;
  }, [slots]);

  const blocked = useMemo(() => blockedDayKeys(blocks), [blocks]);
  const upcomingBlocks = blocks
    .filter((block) => new Date(block.ends_at) > new Date())
    .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const monthTotal = slots.length;

  async function createBlock(fromKey, toKey, reason) {
    const { startsAt, endsAt } = dayRangeIso(fromKey, toKey);
    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "block", startsAt, endsAt, reason: reason || undefined })
    });
    if (!res.ok) {
      onError?.("Não foi possível bloquear.");
      return false;
    }
    setRefresh((n) => n + 1);
    return true;
  }

  async function removeBlock(block) {
    const ok = await confirm({
      title: "Liberar este período?",
      message: `${blockLabel(block)} volta a ter os horários da semana.`,
      confirmLabel: "Liberar"
    });
    if (!ok) return;
    await fetch(`/api/admin/availability?kind=block&id=${block.id}`, { method: "DELETE" });
    onFeedback?.("Período liberado.");
    setRefresh((n) => n + 1);
  }

  async function toggleDay(dayKey) {
    if (dayKey < today) return;
    if (blocked.has(dayKey)) {
      const { startsAt, endsAt } = dayRangeIso(dayKey);
      const block = blocks.find((item) => item.starts_at < endsAt && item.ends_at > startsAt);
      if (block) await removeBlock(block);
      return;
    }
    const ok = await confirm({
      title: `Bloquear ${formatDayKey(dayKey, { weekday: "long", day: "2-digit", month: "long" })}?`,
      message: "Nenhum horário desse dia aparece para os pacientes.",
      confirmLabel: "Bloquear dia",
      tone: "danger"
    });
    if (!ok) return;
    if (await createBlock(dayKey, dayKey)) onFeedback?.(`Dia ${formatDayKey(dayKey)} bloqueado.`);
  }

  async function submitPeriod(event) {
    event.preventDefault();
    if (!period.from || !period.to || period.to < period.from) {
      onError?.("Informe o início e o fim do período.");
      return;
    }
    setSaving(true);
    const ok = await createBlock(period.from, period.to, period.reason.trim());
    setSaving(false);
    if (ok) {
      onFeedback?.(`Bloqueado de ${formatDayKey(period.from)} a ${formatDayKey(period.to)}.`);
      setMonth(period.from.slice(0, 7));
      setPeriod({ from: "", to: "", reason: "" });
    }
  }

  return (
    <Card className="mb-6" title="Agenda por mês">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <p className="mb-4 text-sm leading-6 text-graphite/60">
            Escolha o mês e veja quantos horários abrem em cada dia. Toque num dia para bloquear ou liberar.
            {monthTotal ? (
              <>
                {" "}
                <strong className="font-semibold text-graphite">{monthTotal} horários</strong> livres neste mês.
              </>
            ) : null}
          </p>
          <MonthCalendar
            month={month}
            onMonthChange={setMonth}
            minMonth={currentMonth}
            maxMonth={maxMonth}
            loading={loading}
            onSelectDay={toggleDay}
            dayInfo={(dayKey) => ({
              count: counts.get(dayKey) || 0,
              blocked: blocked.has(dayKey),
              past: dayKey < today,
              disabled: dayKey < today
            })}
          />
        </div>

        <div className="space-y-5">
          <form onSubmit={submitPeriod} className="rounded-2xl border border-olive-900/10 bg-linen/50 p-4">
            <p className="flex items-center gap-2 font-semibold text-graphite">
              <CalendarOff className="h-4 w-4 text-olive-700" />
              Bloquear período
            </p>
            <p className="mt-1 text-xs leading-5 text-graphite/55">
              Férias ou &quot;só atendo a partir de…&quot;: os dias do período ficam sem horários.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-graphite/60">
                De
                <input
                  type="date"
                  min={today}
                  value={period.from}
                  onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value, to: p.to && p.to < e.target.value ? e.target.value : p.to }))}
                  className={inputClassName("mt-1 !px-3")}
                  required
                />
              </label>
              <label className="text-xs font-medium text-graphite/60">
                Até
                <input
                  type="date"
                  min={period.from || today}
                  value={period.to}
                  onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
                  className={inputClassName("mt-1 !px-3")}
                  required
                />
              </label>
            </div>
            <label className="mt-2 block text-xs font-medium text-graphite/60">
              Motivo (opcional)
              <input
                value={period.reason}
                maxLength={120}
                onChange={(e) => setPeriod((p) => ({ ...p, reason: e.target.value }))}
                placeholder="Ex.: férias"
                className={inputClassName("mt-1 !px-3")}
              />
            </label>
            <button type="submit" disabled={saving} className={btnPrimary("mt-3 w-full")}>
              {saving ? "Bloqueando…" : "Bloquear período"}
            </button>
          </form>

          <div>
            <p className="text-sm font-semibold text-graphite">Bloqueios</p>
            {upcomingBlocks.length ? (
              <ul className="mt-2 space-y-2">
                {upcomingBlocks.map((block) => (
                  <li
                    key={block.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-rose-200/70 bg-rose-50/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-graphite">{blockLabel(block)}</p>
                      {block.reason ? <p className="truncate text-xs text-graphite/55">{block.reason}</p> : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBlock(block)}
                      className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-rose-700 hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Liberar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-graphite/50">Nenhum dia bloqueado.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
