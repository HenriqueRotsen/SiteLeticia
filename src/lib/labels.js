export const APPOINTMENT_STATUS_LABELS = {
  scheduled: "Agendada",
  completed: "Concluída",
  cancelled: "Cancelada",
  no_show: "Não compareceu"
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  waived: "Isento"
};

export const LAB_REPORT_STATUS_LABELS = {
  draft: "Em revisão",
  published: "Publicado"
};

export const DIET_STATUS_LABELS = {
  active: "Ativo",
  archived: "Arquivado"
};

export function labelAppointmentStatus(status) {
  return APPOINTMENT_STATUS_LABELS[status] || status || "—";
}

export function labelPaymentStatus(status) {
  return PAYMENT_STATUS_LABELS[status] || status || "—";
}

export function labelLabReportStatus(status) {
  return LAB_REPORT_STATUS_LABELS[status] || status || "—";
}

export function labelDietStatus(status) {
  return DIET_STATUS_LABELS[status] || status || "—";
}

export const UPLOADED_BY_LABELS = {
  patient: "Enviado pelo paciente",
  nutritionist: "Enviado pela Letícia"
};

export const PUBLISHED_BY_LABELS = {
  patient: "Publicado pelo paciente",
  nutritionist: "Publicado pela Letícia"
};

export function labelUploadedBy(value) {
  return UPLOADED_BY_LABELS[value] || "—";
}

export function labelPublishedBy(value) {
  return PUBLISHED_BY_LABELS[value] || "—";
}
