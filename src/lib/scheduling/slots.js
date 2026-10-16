import {
  CONSULTATION_BUFFER_MIN,
  CONSULTATION_DURATION_MIN,
  SLOT_INTERVAL_MIN,
  TIMEZONE
} from "@/lib/constants";
import {
  addZonedDays,
  getWeekdayInTimezone,
  parseTimeOnZonedDay,
  startOfZonedDay
} from "@/lib/scheduling/timezone";

export function appointmentEnd(start) {
  return new Date(start.getTime() + CONSULTATION_DURATION_MIN * 60 * 1000);
}

export function blockedUntil(start) {
  return new Date(start.getTime() + SLOT_INTERVAL_MIN * 60 * 1000);
}

export function overlapsWithBuffer(existingStart, candidateStart) {
  const existingBlockEnd = blockedUntil(existingStart);
  const candidateEnd = appointmentEnd(candidateStart);

  return candidateStart < existingBlockEnd && candidateEnd > existingStart;
}

export function isSlotBlocked(candidateStart, busyRanges) {
  const blockEnd = blockedUntil(candidateStart);

  return busyRanges.some(({ start, end }) => {
    const busyStart = new Date(start);
    const busyEnd = new Date(end);
    return candidateStart < busyEnd && blockEnd > busyStart;
  });
}

export function generateSlotsFromRules({
  from,
  to,
  rules,
  appointments = [],
  blocks = [],
  googleBusy = []
}) {
  const slots = [];
  let cursor = startOfZonedDay(from, TIMEZONE);
  const endDate = startOfZonedDay(to, TIMEZONE);

  const busyRanges = [
    ...appointments
      .filter((a) => a.status === "scheduled")
      .map((a) => ({ start: a.starts_at, end: blockedUntil(new Date(a.starts_at)).toISOString() })),
    ...blocks.map((b) => ({ start: b.starts_at, end: b.ends_at })),
    ...googleBusy.map((b) => ({ start: b.start, end: b.end }))
  ];

  while (cursor <= endDate) {
    const weekday = getWeekdayInTimezone(cursor, TIMEZONE);
    const dayRules = rules.filter((r) => r.active && Number(r.weekday) === weekday);

    for (const rule of dayRules) {
      let slotStart = parseTimeOnZonedDay(cursor, rule.start_time, TIMEZONE);
      const dayEnd = parseTimeOnZonedDay(cursor, rule.end_time, TIMEZONE);

      // Grade de início a cada 60 min (ex.: 9–17 → último às 16:00).
      // O buffer de 15 min só entra na checagem de conflito entre consultas.
      while (appointmentEnd(slotStart) <= dayEnd) {
        if (slotStart >= from && slotStart <= to && !isSlotBlocked(slotStart, busyRanges)) {
          slots.push({
            startsAt: slotStart.toISOString(),
            endsAt: appointmentEnd(slotStart).toISOString()
          });
        }
        slotStart = new Date(slotStart.getTime() + CONSULTATION_DURATION_MIN * 60 * 1000);
      }
    }

    cursor = addZonedDays(cursor, 1, TIMEZONE);
  }

  return slots;
}

export { CONSULTATION_DURATION_MIN, CONSULTATION_BUFFER_MIN, SLOT_INTERVAL_MIN };
