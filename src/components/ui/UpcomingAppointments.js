import Link from "next/link";
import { CalendarClock, MapPin, Video } from "lucide-react";
import Badge, { paymentBadge } from "@/components/ui/Badge";
import { formatCurrency } from "@/components/layout/AppShell";
import { formatAppointmentWhen, safeMeetLink } from "@/lib/appointments/upcoming";
import { googleMapsLink, isInPerson } from "@/lib/appointments/location";

export function MeetJoinButton({ link, size = "md", variant = "gold", className = "" }) {
  const href = safeMeetLink(link);
  if (!href) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-xl border border-dashed border-olive-900/15 px-3 py-2 text-xs font-medium text-graphite/50 ${className}`}
        title="O link é criado quando a consulta é sincronizada com o Google Agenda."
      >
        <Video className="h-3.5 w-3.5" strokeWidth={1.75} />
        Link do Meet ainda não gerado
      </span>
    );
  }

  const sizing = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";
  const colors =
    variant === "light"
      ? "bg-white text-olive-800 hover:bg-olive-50"
      : "bg-[#BD9B72] text-white shadow-xs hover:bg-[#A8875F]";

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#BD9B72]/30 ${sizing} ${colors} ${className}`}
    >
      <Video className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      Entrar no Meet
    </a>
  );
}

// Presencial: "Como chegar" (Google Maps). Online: botão do Meet.
export function AppointmentJoinButton({ appointment, size = "md", variant = "gold", className = "" }) {
  if (!isInPerson(appointment)) {
    return <MeetJoinButton link={appointment?.meet_link} size={size} variant={variant} className={className} />;
  }
  const href = googleMapsLink(appointment.location);
  const sizing = size === "sm" ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm";
  const colors =
    variant === "light"
      ? "bg-white text-olive-800 hover:bg-olive-50"
      : "bg-[#BD9B72] text-white shadow-xs hover:bg-[#A8875F]";
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={appointment.location}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#BD9B72]/30 ${sizing} ${colors} ${className}`}
    >
      <MapPin className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      Como chegar
    </a>
  );
}

/**
 * Lista de próximas consultas com botão do Meet.
 * `hrefFor(appt)` define o link de detalhe; `showPatient` mostra o nome do paciente (visão admin).
 */
export default function UpcomingAppointmentsList({
  appointments,
  hrefFor,
  showPatient = false,
  emptyMessage = "Nenhuma consulta agendada."
}) {
  if (!appointments?.length) {
    return <p className="py-6 text-center text-sm text-graphite/45">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-olive-900/5">
      {appointments.map((appt) => {
        const payment = paymentBadge(appt.payment_status);
        const href = hrefFor?.(appt);
        const title = showPatient ? appt.patients?.full_name || "Paciente" : formatAppointmentWhen(appt.starts_at);
        return (
          <li
            key={appt.id}
            className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linen text-[#BD9B72]">
                <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                {href ? (
                  <Link href={href} className="block truncate text-sm font-semibold text-graphite hover:text-olive-800">
                    {title}
                  </Link>
                ) : (
                  <p className="truncate text-sm font-semibold text-graphite">{title}</p>
                )}
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-graphite/55">
                  {showPatient ? <span>{formatAppointmentWhen(appt.starts_at)}</span> : null}
                  {isInPerson(appt) ? <Badge variant="info">Presencial</Badge> : null}
                  <Badge variant={payment.variant}>Pagamento: {payment.label}</Badge>
                  {appt.amount_cents ? <span>{formatCurrency(appt.amount_cents)}</span> : null}
                </p>
              </div>
            </div>
            <AppointmentJoinButton appointment={appt} size="sm" />
          </li>
        );
      })}
    </ul>
  );
}
