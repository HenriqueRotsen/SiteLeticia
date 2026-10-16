import {
  CONSULTATION_BUFFER_MIN,
  CONSULTATION_DURATION_MIN,
  SLOT_INTERVAL_MIN,
  TIMEZONE
} from "@/lib/constants";

function parseTimeOnDate(date, timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function getWeekdayInTimezone(date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short"
  });
  const day = formatter.format(date);
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[day];
}

export function appointmentEnd(start) {
  return new Date(start.getTime() + CONSULTATION_DURATION_MIN * 60 * 1000);
}

export function blockedUntil(start) {
  return new Date(start.getTime() + SLOT_INTERVAL_MIN * 60 * 1000);
}

export function overlapsWithBuffer(existingStart, candidateStart) {
  const existingBlockEnd = blockedUntil(existingStart);
  const candidateBlockEnd = blockedUntil(candidateStart);
  const candidateEnd = appointmentEnd(candidateStart);

  return candidateStart < existingBlockEnd && candidateEnd > existingStart;
}

export function isSlotBlocked(candidateStart, busyRanges) {
  const candidateEnd = appointmentEnd(candidateStart);
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
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);

  const endDate = new Date(to);

  const busyRanges = [
    ...appointments
      .filter((a) => a.status === "scheduled")
      .map((a) => ({ start: a.starts_at, end: blockedUntil(new Date(a.starts_at)).toISOString() })),
    ...blocks.map((b) => ({ start: b.starts_at, end: b.ends_at })),
    ...googleBusy.map((b) => ({ start: b.start, end: b.end }))
  ];

  while (cursor <= endDate) {
    const weekday = getWeekdayInTimezone(cursor);
    const dayRules = rules.filter((r) => r.active && r.weekday === weekday);

    for (const rule of dayRules) {
      let slotStart = parseTimeOnDate(cursor, rule.start_time);
      const dayEnd = parseTimeOnDate(cursor, rule.end_time);

      while (appointmentEnd(slotStart) <= dayEnd) {
        if (slotStart >= from && slotStart <= to && !isSlotBlocked(slotStart, busyRanges)) {
          slots.push({
            startsAt: slotStart.toISOString(),
            endsAt: appointmentEnd(slotStart).toISOString()
          });
        }
        slotStart = new Date(slotStart.getTime() + SLOT_INTERVAL_MIN * 60 * 1000);
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}

export { CONSULTATION_DURATION_MIN, CONSULTATION_BUFFER_MIN, SLOT_INTERVAL_MIN };
