"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

/**
 * Aviso para preencher a ficha pré-consulta (opcional, mas recomendada).
 * Some sozinho quando a ficha já foi enviada.
 */
export default function PreconsultBanner({ className = "" }) {
  const [state, setState] = useState(null); // null | "draft" | "submitted"

  useEffect(() => {
    let active = true;
    fetch("/api/patients/me/preconsulta")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setState(data.form?.status === "submitted" ? "submitted" : "draft");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (state !== "draft") return null;

  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border border-gold-500/40 bg-gradient-to-br from-cream via-white to-cream p-5 shadow-card sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 text-white">
          <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="font-semibold text-graphite">Preencha sua ficha pré-consulta</p>
          <p className="mt-1 text-sm leading-6 text-graphite/65">
            Leva cerca de 5 minutos e ajuda a Letícia a aproveitar melhor a sua consulta. É opcional, mas faz
            diferença.
          </p>
        </div>
      </div>
      <Link
        href="/app/ficha"
        className="inline-flex shrink-0 items-center justify-center rounded-full bg-graphite px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-porcelain transition hover:bg-olive-800"
      >
        Preencher ficha
      </Link>
    </div>
  );
}
