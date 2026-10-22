"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock, MessageCircle, X } from "lucide-react";
import { TIMEZONE } from "@/lib/constants";
import { zonedDateKey } from "@/lib/scheduling/timezone";
import { site, whatsappLink } from "@/lib/marketing/content";

const BookingContext = createContext({ open: () => {} });

export function useBooking() {
  return useContext(BookingContext);
}

const WHATSAPP_MESSAGE = `Olá, ${site.name}! Gostaria de marcar uma consulta. Pode me orientar sobre horários e valores?`;
const DAYS_AHEAD = 21;

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit"
  });
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatDayLong(iso) {
  return capitalize(
    new Date(iso).toLocaleDateString("pt-BR", {
      timeZone: TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long"
    })
  );
}

function dayChipParts(iso) {
  const date = new Date(iso);
  return {
    weekday: date
      .toLocaleDateString("pt-BR", { timeZone: TIMEZONE, weekday: "short" })
      .replace(".", ""),
    day: date.toLocaleDateString("pt-BR", { timeZone: TIMEZONE, day: "2-digit" }),
    month: date
      .toLocaleDateString("pt-BR", { timeZone: TIMEZONE, month: "short" })
      .replace(".", "")
  };
}

function groupByDay(slots) {
  const groups = new Map();
  for (const slot of slots) {
    const key = zonedDateKey(new Date(slot.startsAt), TIMEZONE);
    if (!groups.has(key)) groups.set(key, { key, startsAt: slot.startsAt, slots: [] });
    groups.get(key).slots.push(slot);
  }
  return Array.from(groups.values()).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

function ModalFrame({ children, onClose, size = "sm", label }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onClose}
        className="modal-backdrop absolute inset-0 bg-graphite/55 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={`modal-panel relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-ivory shadow-[0_30px_80px_rgba(47,42,39,0.35)] outline-none sm:rounded-[1.75rem] ${
          size === "lg" ? "sm:max-w-3xl" : "sm:max-w-md"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-graphite/60 ring-1 ring-graphite/10 transition hover:bg-white hover:text-graphite"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function ChoiceDialog({ onClose, onAgenda }) {
  return (
    <ModalFrame onClose={onClose} label="Marque uma consulta">
      <div className="overflow-y-auto px-6 pb-7 pt-8 sm:px-8">
        <p className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-600">
          <span aria-hidden className="h-px w-8 bg-gold-500/60" />
          Consulta
        </p>
        <h2 className="mt-3 font-display text-3xl leading-[1.1] text-graphite">Como prefere marcar?</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/60">
          Escolha um horário na agenda ou converse direto com a Letícia.
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={onAgenda}
            className="group flex items-center gap-4 rounded-2xl border border-gold-500/40 bg-gradient-to-br from-white to-cream p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-gold-500"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-[0_10px_24px_rgba(165,125,78,0.35)]">
              <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block font-semibold text-graphite">Escolher horário na agenda</span>
              <span className="mt-0.5 block text-sm text-graphite/55">Veja os horários livres e reserve o seu.</span>
            </span>
          </button>

          <a
            href={whatsappLink(site.whatsapp, WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex items-center gap-4 rounded-2xl border border-graphite/10 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#25D366]/60"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_10px_24px_rgba(37,211,102,0.35)]">
              <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span>
              <span className="block font-semibold text-graphite">Falar com a Letícia</span>
              <span className="mt-0.5 block text-sm text-graphite/55">Tire dúvidas e combine pelo WhatsApp.</span>
            </span>
          </a>
        </div>
      </div>
    </ModalFrame>
  );
}

function AgendaDialog({ onClose, onBack }) {
  const router = useRouter();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [activeDay, setActiveDay] = useState("");
  const [selected, setSelected] = useState("");
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    let active = true;
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + DAYS_AHEAD);

    fetch(`/api/appointments/slots?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setEnabled(data.bookingEnabled !== false);
        setSlots(data.bookingEnabled === false ? [] : data.slots || []);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar a agenda agora. Tente de novo ou fale pelo WhatsApp.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => groupByDay(slots), [slots]);

  useEffect(() => {
    if (!activeDay && groups.length) setActiveDay(groups[0].key);
  }, [groups, activeDay]);

  const current = groups.find((group) => group.key === activeDay) || groups[0];

  async function handleContinue() {
    if (!selected) return;
    setContinuing(true);
    const target = `/app/agenda?slot=${encodeURIComponent(selected)}`;

    let authenticated = false;
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      authenticated = Boolean(data?.authenticated);
    } catch {
      authenticated = false;
    }

    onClose();
    router.push(authenticated ? target : `/entrar?next=${encodeURIComponent(target)}`);
  }

  return (
    <ModalFrame onClose={onClose} size="lg" label="Agenda da Letícia">
      <div className="border-b border-graphite/8 px-6 pb-5 pt-8 sm:px-8">
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/45 transition hover:text-graphite"
        >
          ← Voltar
        </button>
        <h2 className="mt-3 font-display text-3xl leading-[1.1] text-graphite sm:text-4xl">Escolha seu horário</h2>
        <p className="mt-2 text-sm leading-6 text-graphite/60">
          Sessões de 60 minutos. Depois você entra ou cria sua conta para confirmar.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-8">
        {loading ? (
          <div className="space-y-4" aria-busy="true">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4].map((item) => (
                <div key={item} className="h-20 w-16 animate-pulse rounded-2xl bg-sand" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-xl bg-sand" />
              ))}
            </div>
          </div>
        ) : error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-800">{error}</p>
        ) : !enabled ? (
          <div className="rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/50 px-5 py-10 text-center">
            <p className="font-medium text-graphite">Agenda pausada no momento</p>
            <p className="mt-1 text-sm text-graphite/55">Fale com a Letícia pelo WhatsApp para combinar um horário.</p>
          </div>
        ) : !groups.length ? (
          <div className="rounded-2xl border border-dashed border-gold-500/40 bg-cream px-5 py-10 text-center">
            <p className="font-medium text-graphite">Nenhum horário livre nos próximos dias</p>
            <p className="mt-1 text-sm text-graphite/55">Chame a Letícia pelo WhatsApp que ela encaixa você.</p>
          </div>
        ) : (
          <>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3" role="tablist" aria-label="Dias disponíveis">
              {groups.map((group) => {
                const parts = dayChipParts(group.startsAt);
                const isActive = current?.key === group.key;
                return (
                  <button
                    key={group.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveDay(group.key)}
                    className={`flex w-[4.4rem] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition ${
                      isActive
                        ? "border-graphite bg-graphite text-porcelain shadow-card"
                        : "border-graphite/10 bg-white text-graphite/70 hover:border-gold-500/60"
                    }`}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70">
                      {parts.weekday}
                    </span>
                    <span className="mt-1 font-display text-2xl leading-none">{parts.day}</span>
                    <span className="mt-1 text-[10px] uppercase tracking-[0.1em] opacity-60">{parts.month}</span>
                  </button>
                );
              })}
            </div>

            {current ? (
              <section aria-label={formatDayLong(current.startsAt)} className="mt-2">
                <p className="text-sm font-semibold text-graphite">{formatDayLong(current.startsAt)}</p>
                <p className="text-xs text-graphite/45">
                  {current.slots.length === 1 ? "1 horário livre" : `${current.slots.length} horários livres`}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {current.slots.map((slot) => {
                    const isSelected = selected === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        onClick={() => setSelected(slot.startsAt)}
                        aria-pressed={isSelected}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                          isSelected
                            ? "border-gold-600 bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-[0_10px_24px_rgba(165,125,78,0.35)]"
                            : "border-graphite/10 bg-white text-graphite hover:border-gold-500/70 hover:bg-cream"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5 opacity-80" strokeWidth={1.75} />
                        {formatTime(slot.startsAt)}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-graphite/8 bg-white/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex min-h-[1.5rem] items-center gap-2 text-sm text-graphite/65">
          {selected ? (
            <>
              <Check className="h-4 w-4 text-olive-700" />
              <span>
                <strong className="font-semibold text-graphite">{formatDayLong(selected)}</strong> às{" "}
                {formatTime(selected)}
              </span>
            </>
          ) : (
            "Selecione um horário para continuar"
          )}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a
            href={whatsappLink(site.whatsapp, WHATSAPP_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-graphite/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-graphite/70 transition hover:border-graphite hover:text-graphite"
          >
            Prefiro o WhatsApp
          </a>
          <button
            type="button"
            disabled={!selected || continuing}
            onClick={handleContinue}
            className="btn-shine inline-flex items-center justify-center rounded-full bg-gradient-to-r from-gold-500 to-gold-600 px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(165,125,78,0.35)] transition disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            {continuing ? "Abrindo…" : "Continuar"}
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

export function BookingProvider({ children }) {
  const [step, setStep] = useState(null); // null | "choice" | "agenda"

  const open = useCallback(() => setStep("choice"), []);
  const close = useCallback(() => setStep(null), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <BookingContext.Provider value={value}>
      {children}
      {step === "choice" ? <ChoiceDialog onClose={close} onAgenda={() => setStep("agenda")} /> : null}
      {step === "agenda" ? <AgendaDialog onClose={close} onBack={() => setStep("choice")} /> : null}
    </BookingContext.Provider>
  );
}
