import { consultationPaymentOptions, pickOption } from "@/lib/payments/card";
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

  // Sem valor gravado: o preço atual da forma escolhida (cartão inclui a taxa).
  return pickOption(consultationPaymentOptions(settings || {}), appointment?.payment_method).cents;
}
