import { TIMEZONE } from "@/lib/constants";

export function formatAppointmentDateTime(iso, timeZone = TIMEZONE) {
  const date = new Date(iso);
  const day = date.toLocaleDateString("pt-BR", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const time = date.toLocaleTimeString("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return `${day}, ${time}`;
}

export function resolveAppointmentAmountCents(appointment, settings = {}) {
  const stored = Number(appointment?.amount_cents);
  if (Number.isFinite(stored) && stored > 0) return stored;

  if (appointment?.type === "return" && settings?.return_price_cents != null) {
    return Number(settings.return_price_cents) || 0;
  }

  return Number(settings?.consultation_price_cents) || 0;
}
