import { TIMEZONE } from "@/lib/constants";

const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function getZonedParts(date, timeZone = TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    weekday: "short"
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_MAP[parts.weekday]
  };
}

/** Converte data/hora de parede em America/Sao_Paulo para um instante UTC. */
export function zonedTimeToUtc(
  { year, month, day, hour = 0, minute = 0, second = 0 },
  timeZone = TIMEZONE
) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second);

  for (let i = 0; i < 4; i += 1) {
    const parts = getZonedParts(new Date(utcMs), timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const wanted = Date.UTC(year, month - 1, day, hour, minute, second);
    utcMs += wanted - asUtc;
  }

  return new Date(utcMs);
}

export function getWeekdayInTimezone(date, timeZone = TIMEZONE) {
  return getZonedParts(date, timeZone).weekday;
}

export function startOfZonedDay(date, timeZone = TIMEZONE) {
  const parts = getZonedParts(date, timeZone);
  return zonedTimeToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour: 0, minute: 0 },
    timeZone
  );
}

export function addZonedDays(date, days, timeZone = TIMEZONE) {
  const parts = getZonedParts(date, timeZone);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return zonedTimeToUtc(
    {
      year: base.getUTCFullYear(),
      month: base.getUTCMonth() + 1,
      day: base.getUTCDate(),
      hour: 0,
      minute: 0
    },
    timeZone
  );
}

export function parseTimeOnZonedDay(dayDate, timeStr, timeZone = TIMEZONE) {
  const [hours, minutes] = String(timeStr)
    .slice(0, 5)
    .split(":")
    .map(Number);
  const parts = getZonedParts(dayDate, timeZone);
  return zonedTimeToUtc(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: hours,
      minute: minutes || 0
    },
    timeZone
  );
}

export function zonedDateKey(date, timeZone = TIMEZONE) {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
