// Filtros e colunas comuns das tabelas de consultas (admin, agenda, paciente, financeiro).

import { CalendarDays, CircleDollarSign, ListFilter, MapPin } from "lucide-react";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

function startsAtMs(row) {
  return new Date(row.starts_at).getTime();
}

export const periodFilter = {
  key: "period",
  label: "Período",
  icon: CalendarDays,
  options: [
    { value: "all", label: "Todas" },
    { value: "upcoming", label: "Próximas" },
    { value: "today", label: "Hoje" },
    { value: "week", label: "Próximos 7 dias" },
    { value: "past", label: "Passadas" }
  ],
  predicate: (row, value) => {
    const starts = startsAtMs(row);
    const now = Date.now();
    if (value === "upcoming") return starts >= now && row.status === "scheduled";
    if (value === "past") return starts < now;
    if (value === "today") return new Date(starts).toDateString() === new Date(now).toDateString();
    if (value === "week") return starts >= now && starts <= now + 7 * 86_400_000;
    return true;
  }
};

export const statusFilter = {
  key: "status",
  label: "Status",
  icon: ListFilter,
  options: [
    { value: "all", label: "Todos os status" },
    ...Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  ],
  predicate: (row, value) => row.status === value
};

export const paymentFilter = {
  key: "payment",
  label: "Pagamento",
  icon: CircleDollarSign,
  options: [
    { value: "all", label: "Todos os pagamentos" },
    ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  ],
  predicate: (row, value) => row.payment_status === value
};

export const modalityFilter = {
  key: "modality",
  label: "Modalidade",
  icon: MapPin,
  options: [
    { value: "all", label: "Online e presencial" },
    { value: "online", label: "Online" },
    { value: "in_person", label: "Presencial" }
  ],
  predicate: (row, value) => (row.modality || "online") === value
};

export const dateSort = {
  sortValue: startsAtMs,
  sortLabels: ["mais antigas", "mais recentes"]
};

export function appointmentSearchFields(row, { includePatient = false } = {}) {
  return [
    includePatient ? row.patients?.full_name : null,
    includePatient ? row.patients?.phone : null,
    APPOINTMENT_STATUS_LABELS[row.status],
    PAYMENT_STATUS_LABELS[row.payment_status],
    row.type === "return" ? "retorno" : "consulta",
    row.modality === "in_person" ? "presencial" : "online",
    new Date(row.starts_at).toLocaleDateString("pt-BR")
  ];
}
