"use client";

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
        <p className="mt-2 text-base font-medium">{waitlist.message}</p>
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
