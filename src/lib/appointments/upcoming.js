/**
 * Seleciona as próximas consultas: status "scheduled", início no futuro,
 * em ordem cronológica. Datas inválidas são descartadas.
 */
export function selectUpcomingAppointments(appointments, { now = new Date(), limit } = {}) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const upcoming = (appointments || [])
    .filter((appt) => appt?.status === "scheduled")
    .map((appt) => ({ appt, ms: new Date(appt.starts_at).getTime() }))
    .filter(({ ms }) => Number.isFinite(ms) && ms > nowMs)
    .sort((a, b) => a.ms - b.ms)
    .map(({ appt }) => appt);

  return Number.isInteger(limit) && limit >= 0 ? upcoming.slice(0, limit) : upcoming;
}

/** Só aceita links https do Google Meet, para não renderizar URLs arbitrárias. */
export function safeMeetLink(link) {
  if (typeof link !== "string" || !link.trim()) return null;
  try {
    const url = new URL(link.trim());
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "meet.google.com") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function formatAppointmentWhen(startsAt) {
  return new Date(startsAt).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}
