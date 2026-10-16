"use client";

import { Search } from "lucide-react";
import { inputClassName } from "@/components/layout/AppShell";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

const PERIOD_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "upcoming", label: "Próximas" },
  { value: "past", label: "Passadas" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  ...Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "Todos" },
  ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
];

function FilterChips({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite/45">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                active
                  ? "border-olive-700 bg-olive-700 text-white shadow-sm"
                  : "border-olive-900/10 bg-white text-graphite/70 hover:border-olive-400 hover:bg-olive-50/70"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="space-y-4">
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

      <div className="space-y-4">
        <FilterChips
          label="Período"
          options={PERIOD_OPTIONS}
          value={filters.period}
          onChange={(value) => update("period", value)}
        />
        <FilterChips
          label="Status"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => update("status", value)}
        />
        <FilterChips
          label="Pagamento"
          options={PAYMENT_OPTIONS}
          value={filters.paymentStatus}
          onChange={(value) => update("paymentStatus", value)}
        />
      </div>

      <p className="text-xs text-graphite/45">
        Mostrando {filteredTotal} de {total} consulta{total === 1 ? "" : "s"}
      </p>
    </div>
  );
}
