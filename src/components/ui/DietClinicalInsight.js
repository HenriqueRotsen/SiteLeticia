"use client";

import { Sparkles } from "lucide-react";

const TONE_STYLES = {
  ok: {
    panel: "border-violet-300/60 bg-gradient-to-br from-violet-50 via-sky-50/80 to-indigo-50/70",
    badge: "bg-violet-700 text-white",
    chip: "border-violet-200 bg-white/80 text-violet-900",
    accent: "bg-violet-500"
  },
  watch: {
    panel: "border-indigo-300/60 bg-gradient-to-br from-indigo-50 via-sky-50 to-violet-50/80",
    badge: "bg-indigo-700 text-white",
    chip: "border-indigo-200 bg-white/80 text-indigo-950",
    accent: "bg-sky-500"
  },
  alert: {
    panel: "border-fuchsia-300/50 bg-gradient-to-br from-fuchsia-50 via-violet-50 to-sky-50/70",
    badge: "bg-fuchsia-800 text-white",
    chip: "border-fuchsia-200 bg-white/80 text-fuchsia-950",
    accent: "bg-fuchsia-500"
  },
  neutral: {
    panel: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-violet-50/50 to-indigo-50/40",
    badge: "bg-slate-800 text-white",
    chip: "border-sky-200 bg-white/80 text-slate-800",
    accent: "bg-sky-500"
  }
};

/**
 * Insight clínico visual (somente nutricionista — nunca exibir ao paciente).
 */
export default function DietClinicalInsight({ insight, compact = false }) {
  if (!insight) return null;

  const styles = TONE_STYLES[insight.tone] || TONE_STYLES.neutral;

  return (
    <aside
      className={`relative overflow-hidden rounded-2xl border ${styles.panel} ${
        compact ? "px-3.5 py-3" : "px-4 py-4"
      }`}
      aria-label="Insight clínico da dieta"
    >
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-25 ${styles.accent} blur-2xl`}
      />
      <div
        className={`pointer-events-none absolute -bottom-8 left-8 h-20 w-20 rounded-full opacity-15 ${styles.accent} blur-2xl`}
      />

      <div className="relative flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${styles.badge} shadow-sm`}
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${styles.badge}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              {insight.eyebrow}
            </span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles.chip}`}>
              Densidade {insight.densityLabel}
            </span>
            {insight.goal ? (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${styles.chip}`}>
                Objetivo · {insight.goal}
              </span>
            ) : null}
          </div>

          <p className={`mt-2 font-semibold text-slate-900 ${compact ? "text-sm" : "text-base"}`}>
            {insight.headline}
          </p>
          <p className={`mt-1.5 leading-relaxed text-slate-700/80 ${compact ? "text-xs" : "text-sm"}`}>
            {insight.body}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span>
              {insight.scope === "refeição" ? "Refeição" : "Plano"} · {insight.densityValue}
            </span>
            <span>{insight.densityRange}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
