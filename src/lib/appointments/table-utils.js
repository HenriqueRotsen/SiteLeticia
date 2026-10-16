export const APPOINTMENT_PAGE_SIZE = 10;

export function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSmartQuery(appointment, query, { includePatient = false } = {}) {
  const q = normalizeSearch(query);
  if (!q) return true;

  const haystack = [
    appointment.id,
    appointment.type,
    appointment.status,
    appointment.payment_status,
    appointment.notes,
    includePatient ? appointment.patients?.full_name : "",
    includePatient ? appointment.patients?.phone : ""
  ]
    .filter(Boolean)
    .map(normalizeSearch)
    .join(" ");

  return q.split(/\s+/).every((token) => haystack.includes(token));
}

export function filterAppointments(appointments, filters, options = {}) {
  const now = Date.now();

  return (appointments || []).filter((appt) => {
    if (!matchesSmartQuery(appt, filters.query, options)) return false;

    if (filters.status && filters.status !== "all" && appt.status !== filters.status) {
      return false;
    }

    if (
      filters.paymentStatus &&
      filters.paymentStatus !== "all" &&
      appt.payment_status !== filters.paymentStatus
    ) {
      return false;
    }

    const starts = new Date(appt.starts_at).getTime();
    if (filters.period === "upcoming" && !(starts >= now && appt.status === "scheduled")) {
      return false;
    }
    if (filters.period === "past" && starts >= now) {
      return false;
    }

    return true;
  });
}

export function sortAppointments(appointments, sortKey, sortDir = "desc") {
  const dir = sortDir === "asc" ? 1 : -1;
  const rows = [...(appointments || [])];

  rows.sort((a, b) => {
    let left;
    let right;

    switch (sortKey) {
      case "patient":
        left = normalizeSearch(a.patients?.full_name);
        right = normalizeSearch(b.patients?.full_name);
        break;
      case "amount":
        left = Number(a.amount_cents) || 0;
        right = Number(b.amount_cents) || 0;
        break;
      case "status":
        left = a.status || "";
        right = b.status || "";
        break;
      case "payment":
        left = a.payment_status || "";
        right = b.payment_status || "";
        break;
      case "starts_at":
      default:
        left = new Date(a.starts_at).getTime();
        right = new Date(b.starts_at).getTime();
        break;
    }

    if (left < right) return -1 * dir;
    if (left > right) return 1 * dir;
    return 0;
  });

  return rows;
}

export function paginateRows(rows, page, pageSize = APPOINTMENT_PAGE_SIZE) {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    total,
    rows: rows.slice(start, start + pageSize)
  };
}
