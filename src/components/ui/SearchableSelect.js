"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Select com pesquisa integrada (single ou multiple).
 * options: [{ value, label, hint? }]
 */
export default function SearchableSelect({
  label,
  options = [],
  value = "",
  values = null,
  onChange,
  onChangeMultiple,
  multiple = false,
  placeholder = "Selecione…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Nenhum resultado",
  disabled = false,
  loading = false,
  icon: Icon = null,
  className = ""
}) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedValues = multiple
    ? Array.isArray(values)
      ? values
      : []
    : value
      ? [value]
      : [];

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((option) => {
      const haystack = normalize(`${option.label} ${option.hint || ""}`);
      return haystack.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open]);

  function toggleOpen() {
    if (disabled || loading) return;
    setOpen((current) => !current);
    setQuery("");
  }

  function selectSingle(nextValue) {
    onChange?.(nextValue);
    setOpen(false);
    setQuery("");
  }

  function toggleMultiple(nextValue) {
    const exists = selectedValues.includes(nextValue);
    const next = exists
      ? selectedValues.filter((item) => item !== nextValue)
      : [...selectedValues, nextValue];
    onChangeMultiple?.(next);
  }

  const triggerLabel = (() => {
    if (loading) return "Carregando…";
    if (!options.length) return "Nenhuma opção disponível";
    if (multiple) {
      if (!selectedOptions.length) return placeholder;
      if (selectedOptions.length === 1) return selectedOptions[0].label;
      return `${selectedOptions.length} selecionados`;
    }
    return selectedOptions[0]?.label || placeholder;
  })();

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label ? (
        <p className="mb-1 text-xs font-medium text-graphite/55">{label}</p>
      ) : null}

      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-olive-600/70" />
        ) : null}
        <button
          type="button"
          disabled={disabled || loading || !options.length}
          onClick={toggleOpen}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          className={`flex w-full items-center gap-2 rounded-xl border bg-white py-2.5 text-left text-sm outline-none transition ${
            open
              ? "border-olive-500 ring-2 ring-olive-100"
              : "border-olive-900/10 hover:border-olive-300"
          } ${disabled || loading || !options.length ? "cursor-not-allowed opacity-60" : ""} ${
            Icon ? "pl-9 pr-3" : "px-3"
          }`}
        >
          <span
            className={`min-w-0 flex-1 truncate ${
              selectedOptions.length ? "text-graphite" : "text-graphite/45"
            }`}
          >
            {triggerLabel}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-graphite/35" strokeWidth={1.75} />
        </button>
        {selectedOptions.length && !multiple && !disabled ? (
          <button
            type="button"
            className="absolute right-8 top-1/2 z-10 -translate-y-1/2 rounded-md p-0.5 text-graphite/35 hover:bg-linen hover:text-graphite/70"
            onClick={() => onChange?.("")}
            aria-label="Limpar seleção"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-xl border border-olive-900/10 bg-white shadow-soft">
          <div className="border-b border-olive-900/8 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-graphite/35" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-olive-900/10 bg-linen/40 py-2 pl-8 pr-3 text-sm text-graphite outline-none placeholder:text-graphite/35 focus:border-olive-500 focus:bg-white"
              />
            </div>
          </div>

          <ul id={listId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length ? (
              filtered.map((option) => {
                const selected = selectedValues.includes(option.value);
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition ${
                        selected ? "bg-olive-50 text-olive-950" : "text-graphite hover:bg-linen/70"
                      }`}
                      onClick={() =>
                        multiple ? toggleMultiple(option.value) : selectSingle(option.value)
                      }
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-olive-700 bg-olive-700 text-white"
                            : "border-olive-900/15 bg-white"
                        }`}
                      >
                        {selected ? <Check className="h-3 w-3" strokeWidth={2.5} /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{option.label}</span>
                        {option.hint ? (
                          <span className="mt-0.5 block truncate text-[11px] text-graphite/45">
                            {option.hint}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })
            ) : (
              <li className="px-3 py-4 text-center text-xs text-graphite/45">{emptyMessage}</li>
            )}
          </ul>

          {multiple && selectedValues.length ? (
            <div className="flex items-center justify-between border-t border-olive-900/8 bg-linen/40 px-3 py-2">
              <span className="text-[11px] text-graphite/50">
                {selectedValues.length} selecionado{selectedValues.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                className="text-[11px] font-semibold text-olive-800 hover:underline"
                onClick={() => onChangeMultiple?.([])}
              >
                Limpar
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
