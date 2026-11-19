"use client";

// Calendário de um mês com navegação entre meses. Cada dia mostra quantos horários tem
// e pode estar bloqueado, desativado ou selecionado.

import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAY_SHORT, addMonths, monthGrid, monthTitle } from "@/lib/scheduling/month";

export default function MonthCalendar({
  month,
  onMonthChange,
  minMonth,
  maxMonth,
  dayInfo = () => ({}),
  selectedDay,
  onSelectDay,
  loading = false,
  countLabel = (count) => `${count} ${count === 1 ? "horário" : "horários"}`
}) {
  const canPrev = !minMonth || month > minMonth;
  const canNext = !maxMonth || month < maxMonth;
  const navButton =
    "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-olive-900/10 bg-white text-graphite/70 transition hover:bg-linen disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button type="button" className={navButton} disabled={!canPrev} onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Mês anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-base font-semibold text-graphite" aria-live="polite">
          {monthTitle(month)}
        </p>
        <button type="button" className={navButton} disabled={!canNext} onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Próximo mês">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        className={`grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1 sm:gap-1.5 ${loading ? "opacity-50" : ""}`}
        role="grid"
      >
        {WEEKDAY_SHORT.map((label) => (
          <div key={label} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-graphite/40">
            {label}
          </div>
        ))}
        {monthGrid(month)
          .flat()
          .map((dayKey, index) => {
            if (!dayKey) return <div key={`empty-${index}`} />;
            const info = dayInfo(dayKey) || {};
            const day = Number(dayKey.slice(8));
            const selected = selectedDay === dayKey;
            const clickable = Boolean(onSelectDay) && !info.disabled;
            const tone = selected
              ? "border-olive-700 bg-olive-700 text-white"
              : info.blocked
                ? "border-rose-200 bg-[repeating-linear-gradient(135deg,#fff1f2,#fff1f2_6px,#ffe4e6_6px,#ffe4e6_12px)] text-rose-800"
                : info.count
                  ? "border-olive-300 bg-olive-50 text-graphite hover:border-olive-500"
                  : "border-olive-900/5 bg-white/60 text-graphite/35";
            return (
              <button
                key={dayKey}
                type="button"
                disabled={!clickable}
                onClick={() => onSelectDay?.(dayKey)}
                aria-pressed={selected}
                aria-label={`${day}${info.blocked ? ", bloqueado" : info.count ? `, ${countLabel(info.count)}` : ", sem horários"}`}
                className={`flex aspect-square min-w-0 flex-col items-center justify-center rounded-lg border text-sm transition sm:aspect-auto sm:min-h-16 sm:items-start sm:justify-between sm:rounded-xl sm:p-2 ${tone} ${
                  clickable ? "cursor-pointer" : "cursor-default"
                } ${info.past ? "opacity-40" : ""}`}
              >
                <span className="font-semibold leading-none">{day}</span>
                {info.blocked ? (
                  <span className="mt-0.5 hidden text-[10px] font-semibold sm:block">Bloqueado</span>
                ) : info.count ? (
                  <>
                    <span className={`mt-1 h-1.5 w-1.5 rounded-full sm:hidden ${selected ? "bg-white" : "bg-olive-600"}`} />
                    <span className={`hidden text-[10px] font-medium sm:block ${selected ? "text-white/85" : "text-olive-800"}`}>
                      {countLabel(info.count)}
                    </span>
                  </>
                ) : null}
              </button>
            );
          })}
      </div>
    </div>
  );
}
