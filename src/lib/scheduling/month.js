// Calendário mensal da agenda (fuso de São Paulo): chaves "AAAA-MM" e "AAAA-MM-DD".

import { TIMEZONE } from "@/lib/constants";
import { zonedDateKey, zonedTimeToUtc } from "@/lib/scheduling/timezone";

export const BOOKING_HORIZON_DAYS = 180;

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function monthKeyOf(date) {
  return zonedDateKey(new Date(date), TIMEZONE).slice(0, 7);
}

export function addMonths(monthKey, delta) {
  const [year, month] = monthKey.split("-").map(Number);
  const index = year * 12 + (month - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function monthTitle(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTHS[month - 1]} de ${year}`;
}

/** Semanas do mês (domingo a sábado); dias fora do mês vêm como null. */
export function monthGrid(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(`${monthKey}-${String(day).padStart(2, "0")}`);
  }
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Início e fim (exclusivo) de um dia ou intervalo de dias, no fuso da clínica, em ISO. */
export function dayRangeIso(fromKey, toKey = fromKey) {
  const [y1, m1, d1] = fromKey.split("-").map(Number);
  const [y2, m2, d2] = toKey.split("-").map(Number);
  const start = zonedTimeToUtc({ year: y1, month: m1, day: d1 }, TIMEZONE);
  const end = zonedTimeToUtc({ year: y2, month: m2, day: d2 + 1 }, TIMEZONE);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export function monthRangeIso(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return dayRangeIso(`${monthKey}-01`, `${monthKey}-${String(last).padStart(2, "0")}`);
}

/** Dias do intervalo [startsAt, endsAt) que ficam bloqueados por inteiro ou em parte. */
export function blockedDayKeys(blocks = []) {
  const keys = new Set();
  for (const block of blocks) {
    let cursor = new Date(block.starts_at);
    const end = new Date(block.ends_at);
    while (cursor < end) {
      keys.add(zonedDateKey(cursor, TIMEZONE));
      cursor = new Date(cursor.getTime() + 6 * 3600_000);
    }
  }
  return keys;
}

export function formatDayKey(dayKey, options = { day: "2-digit", month: "2-digit", year: "numeric" }) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString("pt-BR", { timeZone: "UTC", ...options });
}
