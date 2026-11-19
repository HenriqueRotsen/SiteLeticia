"use client";

import Link from "next/link";

export default function WaitlistPositionCard({ waitlist, loading = false }) {
  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-olive-200/80 bg-gradient-to-r from-linen to-white p-6 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-olive-700">Sua posição na fila</p>
        <p className="mt-2 text-4xl font-semibold text-graphite/45">Carregando...</p>
        <p className="mt-3 text-sm leading-6 text-graphite/45">
          Buscando sua posição atual na lista de espera.
        </p>
      </div>
    );
  }

  if (!waitlist?.found) return null;

  if (waitlist.status === "called") {
    return (
      <div className="mb-6 rounded-2xl border border-olive-200 bg-olive-50 p-5 text-olive-900">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-olive-700">Lista de espera</p>
        <p className="mt-2 text-base font-medium">Chegou a sua vez! Você já pode marcar sua consulta.</p>
        <Link
          href="/app/agenda"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive-800"
        >
          Marcar consulta
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-olive-200/80 bg-gradient-to-r from-linen to-white p-6 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-olive-700">Sua posição na fila</p>
      <p className="mt-2 text-4xl font-semibold text-graphite">#{waitlist.position}</p>
      <p className="mt-3 text-sm leading-6 text-graphite/65">{waitlist.message}</p>
    </div>
  );
}
