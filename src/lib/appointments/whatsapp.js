import { formatAppointmentDateTime } from "@/lib/datetime";
import { googleMapsLink, isInPerson } from "@/lib/appointments/location";

function waNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.startsWith("55") ? digits : `55${digits}`;
}

// Mensagem pronta para a Letícia mandar ao paciente com a data e, se presencial, a localização.
export function appointmentWhatsappMessage({ fullName, appointment }) {
  const first = String(fullName || "").trim().split(/\s+/)[0] || "";
  const when = formatAppointmentDateTime(appointment.starts_at);
  const lines = [`Olá${first ? `, ${first}` : ""}! Sua consulta está marcada para ${when}.`];
  if (isInPerson(appointment)) {
    lines.push(`Será presencial, no endereço: ${appointment.location}`);
    const maps = googleMapsLink(appointment.location);
    if (maps) lines.push(`Como chegar: ${maps}`);
  } else if (appointment.meet_link) {
    lines.push(`Link da consulta online: ${appointment.meet_link}`);
  }
  lines.push("Qualquer dúvida, é só me chamar por aqui.");
  return lines.join("\n");
}

export function appointmentWhatsappLink({ phone, fullName, appointment }) {
  const number = waNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(appointmentWhatsappMessage({ fullName, appointment }))}`;
}
