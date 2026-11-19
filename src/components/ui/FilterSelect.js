"use client";

// Seletor de filtro no visual do sistema (rótulo pequeno + valor), usado nas tabelas.

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export default function FilterSelect({ label, icon: Icon, options, value, onChange, defaultValue = "all", align = "left" }) {
  const listId = useId();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];
  const isActive = value !== defaultValue;

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
          className={`absolute z-40 mt-1.5 max-h-72 min-w-full overflow-y-auto rounded-xl border border-olive-900/10 bg-white py-1 shadow-soft ${
            align === "right" ? "right-0" : "left-0"
          }`}
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
                <span className="min-w-0 flex-1 whitespace-nowrap">{option.label}</span>
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
