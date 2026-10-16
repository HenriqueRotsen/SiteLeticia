"use client";

import { Search } from "lucide-react";
import { inputClassName } from "@/components/layout/AppShell";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

export default function AppointmentsToolbar({
  filters,
  onChange,
  total,
  filteredTotal,
  showPatientHint = false
}) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/35" />
        <input
          value={filters.query}
          onChange={(event) => update("query", event.target.value)}
          className={inputClassName("pl-10")}
          placeholder={
            showPatientHint
              ? "Buscar por paciente, status, telefone..."
              : "Buscar por status, tipo, observações..."
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-graphite/45">
            Período
          </span>
          <select
            value={filters.period}
            onChange={(event) => update("period", event.target.value)}
            className={inputClassName()}
          >
            <option value="all">Todos</option>
            <option value="upcoming">Próximas</option>
            <option value="past">Passadas</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-graphite/45">
            Status
          </span>
          <select
            value={filters.status}
            onChange={(event) => update("status", event.target.value)}
            className={inputClassName()}
          >
            <option value="all">Todos</option>
            {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-graphite/45">
            Pagamento
          </span>
          <select
            value={filters.paymentStatus}
            onChange={(event) => update("paymentStatus", event.target.value)}
            className={inputClassName()}
          >
            <option value="all">Todos</option>
            {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-graphite/45">
        Mostrando {filteredTotal} de {total} consulta{total === 1 ? "" : "s"}
      </p>
    </div>
  );
}
