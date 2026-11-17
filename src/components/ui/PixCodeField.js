"use client";

// Campo para a Letícia colar o PIX copia e cola, com conferência do valor.

import { describePixCode } from "@/lib/payments/pix-brcode";

const TONES = {
  success: "text-olive-800",
  warning: "text-amber-800",
  error: "text-rose-700",
  muted: "text-graphite/45"
};

export default function PixCodeField({ label, value, onChange, expectedCents, hint }) {
  const status = describePixCode(value, expectedCents);
  return (
    <label className="block text-sm font-medium text-graphite">
      {label}
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value.replace(/[\r\n]+/g, "").trim())}
        rows={3}
        spellCheck={false}
        placeholder="00020126…"
        className="mt-1 w-full rounded-xl border border-olive-900/15 bg-white px-3 py-2 font-mono text-xs outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-200"
      />
      <span className={`mt-1 block text-xs font-normal ${TONES[status.tone]}`}>
        {status.message || hint || "Gere no app do banco um PIX com valor e cole aqui o código copia e cola."}
      </span>
    </label>
  );
}
