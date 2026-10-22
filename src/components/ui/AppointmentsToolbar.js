"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, CalendarDays, CircleDollarSign, ListFilter, Search, X } from "lucide-react";
import { inputClassName } from "@/components/layout/AppShell";
import { APPOINTMENT_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/labels";

const PERIOD_OPTIONS = [
  { value: "all", label: "Todas" },
  { value: "upcoming", label: "Próximas" },
  { value: "past", label: "Passadas" }
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  ...Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
];

const PAYMENT_OPTIONS = [
  { value: "all", label: "Todos os pagamentos" },
  ...Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
];

function FilterSelect({ label, icon: Icon, options, value, onChange }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];
  const isActive = value !== "all";

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={`group flex w-full items-center gap-2 rounded-xl border bg-white px-3 py-2 text-left text-sm outline-none transition ${
          open
            ? "border-olive-500 shadow-xs ring-2 ring-olive-100"
            : isActive
              ? "border-olive-400/70 bg-olive-50/60 shadow-xs hover:border-olive-500"
              : "border-olive-900/10 hover:border-olive-300 hover:bg-linen/40"
        }`}
      >
        {Icon ? (
          <Icon
            className={`h-3.5 w-3.5 shrink-0 ${isActive || open ? "text-olive-700" : "text-graphite/40"}`}
            strokeWidth={1.85}
          />
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-graphite/40">
            {label}
          </span>
          <span
            className={`block truncate text-sm font-medium leading-tight ${
              isActive ? "text-olive-900" : "text-graphite/75"
            }`}
          >
            {selected?.label}
          </span>
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-graphite/35 transition ${open ? "rotate-180 text-olive-700" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-1.5 overflow-hidden rounded-xl border border-olive-900/10 bg-white py-1 shadow-soft"
        >
          {options.map((option) => {
            const selectedOption = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selectedOption}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${
                  selectedOption
                    ? "bg-olive-50 font-semibold text-olive-900"
                    : "text-graphite/80 hover:bg-linen/70"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {selectedOption ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-olive-700" strokeWidth={2.5} />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
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

  const hasActiveFilters =
    filters.period !== "all" || filters.status !== "all" || filters.paymentStatus !== "all" || Boolean(filters.query);

  function clearFilters() {
    onChange({
      query: "",
      period: "all",
      status: "all",
      paymentStatus: "all"
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite/35" />
          <input
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            className={inputClassName("!py-2.5 pl-9 text-sm")}
            placeholder={
              showPatientHint ? "Buscar paciente, telefone..." : "Buscar status, tipo..."
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-[min(100%,28rem)] lg:shrink-0">
          <FilterSelect
            label="Período"
            icon={CalendarDays}
            options={PERIOD_OPTIONS}
            value={filters.period}
            onChange={(value) => update("period", value)}
          />
          <FilterSelect
            label="Status"
            icon={ListFilter}
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(value) => update("status", value)}
          />
          <FilterSelect
            label="Pagamento"
            icon={CircleDollarSign}
            options={PAYMENT_OPTIONS}
            value={filters.paymentStatus}
            onChange={(value) => update("paymentStatus", value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-graphite/45">
          {filteredTotal === total
            ? `${total} consulta${total === 1 ? "" : "s"}`
            : `${filteredTotal} de ${total}`}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-olive-800 transition hover:bg-olive-50"
          >
            <X className="h-3 w-3" strokeWidth={2.25} />
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
