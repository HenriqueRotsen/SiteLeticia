"use client";

import { useEffect, useRef, useState } from "react";
import { Braces } from "lucide-react";
import { PRESET_VARIABLES, formatVariableToken } from "@/lib/presets/variables";

const GROUP_LABELS = {
  paciente: "Paciente",
  profissional: "Profissional",
  clinico: "Clínico"
};

/**
 * Botão {{}} para inserir variáveis de template em campos de texto.
 */
export default function VariableInsertButton({ onInsert, className = "" }) {
  const [open, setOpen] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function insert(key) {
    const token = formatVariableToken(key);
    if (!token || token === "{{}}") return;
    onInsert?.(token);
    setOpen(false);
    setCustomKey("");
  }

  const grouped = PRESET_VARIABLES.reduce((acc, item) => {
    const group = item.group || "clinico";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-lg border border-olive-900/10 bg-white px-2 py-1 text-[11px] font-semibold text-olive-800 shadow-xs transition hover:border-olive-300 hover:bg-olive-50"
        onClick={() => setOpen((value) => !value)}
        title="Inserir variável"
      >
        <Braces className="h-3.5 w-3.5" strokeWidth={1.75} />
        {"{{}}"}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-72 overflow-hidden rounded-xl border border-olive-900/10 bg-white shadow-soft">
          <div className="max-h-72 space-y-3 overflow-y-auto p-3">
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-graphite/40">
                  {GROUP_LABELS[group] || group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className="rounded-lg border border-olive-900/8 bg-linen/50 px-2 py-1 text-[11px] font-medium text-graphite/75 hover:border-olive-300 hover:bg-olive-50"
                      onClick={() => insert(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-olive-900/8 bg-linen/40 p-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-graphite/40">
              Personalizada
            </p>
            <div className="flex gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-olive-900/10 bg-white px-2 py-1.5 text-xs outline-none focus:border-olive-500"
                placeholder="ex.: ferritina"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insert(customKey);
                  }
                }}
              />
              <button
                type="button"
                className="rounded-lg bg-olive-800 px-2.5 py-1.5 text-xs font-semibold text-white"
                onClick={() => insert(customKey)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Campo com rótulo + botão {{}} alinhado. */
export function VariableField({ label, children, onInsert }) {
  return (
    <div>
      <div className="mb-1 flex min-h-7 items-center justify-between gap-2">
        <span className="text-xs font-medium text-graphite/55">{label}</span>
        {onInsert ? <VariableInsertButton onInsert={onInsert} /> : null}
      </div>
      {children}
    </div>
  );
}
