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
  { value: "all", label: "Status" },
  ...Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "Pagamento" },
  ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
];

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
        active
          ? "border-olive-700 bg-olive-700 text-white"
          : "border-olive-900/10 bg-white text-graphite/65 hover:border-olive-400 hover:bg-olive-50/70"
      }`}
    >
      {children}
    </button>
  );
}

function ChipRow({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <Chip
          key={option.value}
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Chip>
      ))}
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
    <div className="space-y-2.5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite/35" />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            className={inputClassName("!py-2 pl-9 text-sm")}
            placeholder={
              showPatientHint
                ? "Buscar paciente, telefone..."
                : "Buscar status, tipo..."
            }
          />
        </div>
        <p className="shrink-0 text-xs text-graphite/45 sm:text-right">
          {filteredTotal}/{total}
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-olive-900/5 pt-2.5">
        <ChipRow
          options={PERIOD_OPTIONS}
          value={filters.period}
          onChange={(value) => update("period", value)}
        />
        <ChipRow
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(value) => update("status", value)}
        />
        <ChipRow
          options={PAYMENT_OPTIONS}
          value={filters.paymentStatus}
          onChange={(value) => update("paymentStatus", value)}
        />
      </div>
    </div>
  );
}
