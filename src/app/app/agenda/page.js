"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock, MapPin, MessageCircle, Video } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import BookingPaymentPanel from "@/components/ui/BookingPaymentPanel";
import { TIMEZONE } from "@/lib/constants";
import { zonedDateKey } from "@/lib/scheduling/timezone";
import { site, whatsappLink } from "@/lib/marketing/content";

const IN_PERSON_MESSAGE = `Olá, ${site.name}! Gostaria de marcar uma consulta presencial. Quais horários você tem disponíveis?`;

function ModalityCard({ active, icon: Icon, title, description, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
        active ? "border-olive-700 bg-olive-50 ring-2 ring-olive-200" : "border-olive-900/10 bg-white hover:border-olive-400"
      }`}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-olive-700 text-white" : "bg-linen text-olive-800"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-graphite">{title}</span>
        <span className="mt-0.5 block text-sm leading-5 text-graphite/55">{description}</span>
      </span>
    </button>
  );
}

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDayHeading(iso) {
  const label = new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupSlotsByDay(slots) {
  const groups = new Map();

  for (const slot of slots) {
    const key = zonedDateKey(new Date(slot.startsAt), TIMEZONE);
    if (!groups.has(key)) {
      groups.set(key, { key, startsAt: slot.startsAt, slots: [] });
    }
    groups.get(key).slots.push(slot);
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );
}

export default function AgendaPage() {
  const [slots, setSlots] = useState([]);
  const [payment, setPayment] = useState({ settings: {}, methods: [] });
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingEnabled, setBookingEnabled] = useState(true);
  const [bookingMessage, setBookingMessage] = useState("");
  const [slotNotice, setSlotNotice] = useState("");
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [modality, setModality] = useState(null);

  const slotGroups = useMemo(() => {
    const visible = slots.slice(0, 40);
    if (selected && !visible.some((slot) => slot.startsAt === selected)) {
      const chosen = slots.find((slot) => slot.startsAt === selected);
      if (chosen) visible.push(chosen);
    }
    return groupSlotsByDay(visible);
  }, [slots, selected]);
  const selectedDate = selected ? new Date(selected) : null;

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 21);

    Promise.all([
      fetch(`/api/appointments/slots?from=${from.toISOString()}&to=${to.toISOString()}`).then(async (r) => ({
        ok: r.ok,
        data: await r.json()
      })),
      fetch("/api/payment-info").then(async (r) => ({ ok: r.ok, data: await r.json() }))
    ])
      .then(([slotsRes, paymentRes]) => {
        const slotsData = slotsRes.data || {};
        const paymentData = paymentRes.data || {};
        const enabled =
          slotsData.bookingEnabled !== false && paymentData.bookingEnabled !== false;
        const list = enabled ? slotsData.slots || [] : [];
        setBookingEnabled(enabled);
        setBookingMessage(
          slotsData.message ||
            (!enabled
              ? "A marcação de consultas está temporariamente desativada. Fale com a Letícia pelo WhatsApp."
              : "")
        );
        setSlots(list);
        setPayment(paymentData);

        // Horário escolhido no pop-up do site (?slot=...): já deixa selecionado.
        const wanted = new URLSearchParams(window.location.search).get("slot");
        if (wanted) setModality("online");
        if (wanted && enabled) {
          const wantedTime = new Date(wanted).getTime();
          const match = list.find((slot) => new Date(slot.startsAt).getTime() === wantedTime);
          if (match) {
            setSelected(match.startsAt);
            setSlotNotice("Reservamos o horário que você escolheu. Confirme abaixo para finalizar.");
          } else if (!Number.isNaN(wantedTime)) {
            setSlotNotice(
              "O horário que você escolheu não está mais disponível. Escolha outro abaixo."
            );
          }
        }
        setLoadingAgenda(false);
      })
      .catch(() => {
        setFeedback("Falha ao carregar a agenda. Atualize a página.");
        setLoadingAgenda(false);
      });
  }, []);

  async function book() {
    if (!selected) return;
    setLoading(true);
    setFeedback("");
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startsAt: selected, type: "consultation" })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setFeedback(data.message || "Não foi possível agendar.");
      return;
    }
    setFeedback(data.calendarWarning || "Consulta agendada com sucesso!");
    window.location.href = "/app/consultas";
  }

  return (
    <PatientShell
      title="Agendar consulta"
      subtitle="Escolha o melhor horário disponível"
      breadcrumbs={["Paciente", "Agenda"]}
    >
      {!bookingEnabled ? (
        <Card className="mb-4 border-amber-200 bg-amber-50/80">
          <h2 className="font-semibold text-amber-950">Agendamentos pausados</h2>
          <p className="mt-2 text-sm leading-6 text-amber-900/80">
            {bookingMessage ||
              "A Letícia desativou temporariamente a marcação de novas consultas. Entre em contato para combinar um horário."}
          </p>
        </Card>
      ) : null}

      {slotNotice ? (
        <p className="mb-4 rounded-xl border border-gold-500/40 bg-cream px-4 py-3 text-sm leading-6 text-graphite/80">
          {slotNotice}
        </p>
      ) : null}

      <Card className="mb-4">
        <h2 className="font-semibold text-graphite">Como prefere a consulta?</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <ModalityCard
            active={modality === "online"}
            icon={Video}
            title="Online"
            description="Por vídeo, pelo Google Meet. Escolha o horário aqui."
            onClick={() => setModality("online")}
          />
          <ModalityCard
            active={modality === "in_person"}
            icon={MapPin}
            title="Presencial"
            description="No consultório. O horário é combinado com a Letícia pelo WhatsApp."
            onClick={() => setModality("in_person")}
          />
        </div>
      </Card>

      {modality === null ? null : modality === "in_person" ? (
        <Card>
          <h2 className="font-semibold text-graphite">Consulta presencial</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-graphite/60">
            Para consultas presenciais, fale com a Letícia pelo WhatsApp. Ela confirma o horário e marca a consulta
            no sistema. Depois ela aparece aqui na sua área, com o endereço e o mapa.
          </p>
          <a
            href={whatsappLink(site.whatsapp, IN_PERSON_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1fb457]"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            Combinar pelo WhatsApp
          </a>
        </Card>
      ) : loadingAgenda ? (
        <Card>
          <p className="text-sm text-graphite/55">Carregando agenda…</p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-graphite">Horários disponíveis</h2>
                <p className="mt-1 text-sm text-graphite/60">Sessões de 60 minutos</p>
              </div>
              {selectedDate && bookingEnabled ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-olive-100 px-3 py-2 text-sm font-medium text-olive-800">
                  <Check className="h-4 w-4" />
                  {formatDayHeading(selected)} · {formatSlotTime(selected)}
                </div>
              ) : null}
            </div>

            {!bookingEnabled ? (
              <div className="mt-6 rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/40 px-4 py-10 text-center">
                <p className="font-medium text-graphite">Marcação indisponível no momento</p>
                <p className="mt-2 text-sm text-graphite/55">
                  Assim que a agenda for reaberta, os horários voltam a aparecer aqui.
                </p>
              </div>
            ) : slotGroups.length ? (
              <div className="mt-6 space-y-5">
                {slotGroups.map((group) => (
                  <section
                    key={group.key}
                    className="overflow-hidden rounded-2xl border border-olive-900/10 bg-linen/50"
                  >
                    <div className="flex items-center gap-2 border-b border-olive-900/10 bg-porcelain px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                        <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-graphite">
                          {formatDayHeading(group.startsAt)}
                        </p>
                        <p className="text-xs text-graphite/45">
                          {group.slots.length === 1
                            ? "1 horário livre"
                            : `${group.slots.length} horários livres`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 p-4">
                      {group.slots.map((slot) => {
                        const isSelected = selected === slot.startsAt;

                        return (
                          <button
                            key={slot.startsAt}
                            type="button"
                            onClick={() => setSelected(slot.startsAt)}
                            className={`inline-flex min-w-[5.5rem] items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                              isSelected
                                ? "border-olive-700 bg-olive-700 text-white shadow-xs"
                                : "border-olive-900/10 bg-white text-graphite hover:border-olive-400 hover:bg-olive-50/70"
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5 opacity-80" strokeWidth={1.75} />
                            {formatSlotTime(slot.startsAt)}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-olive-300/80 bg-olive-50/40 px-4 py-10 text-center">
                <p className="font-medium text-graphite">Nenhum horário disponível</p>
                <p className="mt-2 text-sm text-graphite/55">
                  Tente novamente em alguns dias ou entre em contato com a Letícia.
                </p>
              </div>
            )}
          </Card>

          <Card className="lg:sticky lg:top-[calc(var(--demo-banner-height,0px)+5.5rem)] lg:self-start">
            <BookingPaymentPanel
              payment={payment}
              selectedSummary={
                selectedDate && bookingEnabled
                  ? { day: formatDayHeading(selected), time: formatSlotTime(selected) }
                  : null
              }
              loading={loading}
              disabled={!bookingEnabled || !selected}
              feedback={feedback}
              onConfirm={book}
              confirmLabel={bookingEnabled ? "Confirmar agendamento" : "Agendamentos pausados"}
            />
          </Card>
        </div>
      )}
    </PatientShell>
  );
}
