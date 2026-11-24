"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock, MapPin, MessageCircle, Video } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import BookingPaymentPanel from "@/components/ui/BookingPaymentPanel";
import MonthCalendar from "@/components/ui/MonthCalendar";
import { BOOKING_HORIZON_DAYS, formatDayKey, monthKeyOf, monthTitle } from "@/lib/scheduling/month";
import { TIMEZONE } from "@/lib/constants";
import { zonedDateKey } from "@/lib/scheduling/timezone";
import { site, whatsappLink } from "@/lib/marketing/content";
import Link from "next/link";
import { pickUsablePackage, remainingSessions } from "@/lib/packages/pricing";
import { consultationPaymentOptions } from "@/lib/payments/card";

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
  const [packages, setPackages] = useState({ catalog: [], mine: [] });
  const [month, setMonth] = useState(() => monthKeyOf(new Date()));
  const [day, setDay] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");

  // Horários por dia (no fuso da clínica) para o calendário do mês.
  const slotsByDay = useMemo(() => {
    const map = new Map();
    for (const slot of slots) {
      const key = zonedDateKey(new Date(slot.startsAt), TIMEZONE);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(slot);
    }
    return map;
  }, [slots]);
  const daySlots = day ? slotsByDay.get(day) || [] : [];
  const firstDayKey = slots.length ? zonedDateKey(new Date(slots[0].startsAt), TIMEZONE) : "";
  const lastMonth = slots.length ? monthKeyOf(slots[slots.length - 1].startsAt) : month;
  const monthHasSlots = slots.some((slot) => monthKeyOf(slot.startsAt) === month);
  const nextDayKey = [...slotsByDay.keys()].find((key) => key.slice(0, 7) > month) || "";

  function goToDay(dayKey) {
    setMonth(dayKey.slice(0, 7));
    setDay(dayKey);
  }

  const selectedDate = selected ? new Date(selected) : null;

  useEffect(() => {
    fetch("/api/packages")
      .then((r) => r.json())
      .then((data) => setPackages({ catalog: data.catalog || [], mine: data.mine || [] }))
      .catch(() => {});
  }, []);

  const usablePackage = pickUsablePackage(packages.mine);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + BOOKING_HORIZON_DAYS);

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
        // Abre no mês do primeiro horário livre (ex.: agenda liberada em dezembro, atendimentos em janeiro).
        if (list.length) {
          const first = zonedDateKey(new Date(list[0].startsAt), TIMEZONE);
          setMonth(first.slice(0, 7));
          setDay(first);
        }

        // Horário escolhido no pop-up do site (?slot=...): já deixa selecionado.
        const wanted = new URLSearchParams(window.location.search).get("slot");
        if (wanted) setModality("online");
        if (wanted && enabled) {
          const wantedTime = new Date(wanted).getTime();
          const match = list.find((slot) => new Date(slot.startsAt).getTime() === wantedTime);
          if (match) {
            setSelected(match.startsAt);
            const matchDay = zonedDateKey(new Date(match.startsAt), TIMEZONE);
            setMonth(matchDay.slice(0, 7));
            setDay(matchDay);
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
      body: JSON.stringify({ startsAt: selected, paymentMethod: usablePackage ? "pix" : paymentMethod })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setFeedback(data.message || "Não foi possível agendar.");
      return;
    }
    setFeedback(
      data.calendarWarning || (data.usedPackage ? `Consulta agendada pelo pacote “${data.usedPackage.name}”.` : "Consulta agendada com sucesso!")
    );
    // Vai direto para a consulta, onde fica o PIX ou o botão de pagar no cartão.
    window.location.href = data.appointment?.id ? `/app/consultas/${data.appointment.id}` : "/app/consultas";
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

      {modality === "online" && usablePackage ? (
        <p className="mb-4 rounded-xl border border-olive-200 bg-olive-50 px-4 py-3 text-sm leading-6 text-olive-900">
          Você tem {remainingSessions(usablePackage)}{" "}
          {remainingSessions(usablePackage) === 1 ? "consulta disponível" : "consultas disponíveis"} no pacote “
          {usablePackage.name}”. Esta consulta já sai paga pelo pacote.
        </p>
      ) : modality === "online" && packages.catalog.length ? (
        <p className="mb-4 text-sm text-graphite/60">
          Vai fazer acompanhamento?{" "}
          <Link href="/app/financeiro" className="font-semibold text-olive-800 hover:underline">
            Veja os pacotes com desconto
          </Link>
          .
        </p>
      ) : null}

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
            ) : slots.length ? (
              <div className="mt-5 space-y-5">
                {firstDayKey && firstDayKey.slice(0, 7) !== monthKeyOf(new Date()) && month === firstDayKey.slice(0, 7) ? (
                  <p className="rounded-xl border border-olive-200 bg-olive-50 px-3 py-2 text-sm text-olive-900">
                    Os atendimentos começam em {formatDayKey(firstDayKey, { day: "numeric", month: "long" })}.
                  </p>
                ) : null}
                <MonthCalendar
                  month={month}
                  onMonthChange={(next) => {
                    setMonth(next);
                    setDay("");
                  }}
                  minMonth={monthKeyOf(new Date())}
                  maxMonth={lastMonth}
                  selectedDay={day}
                  onSelectDay={setDay}
                  dayInfo={(dayKey) => {
                    const count = slotsByDay.get(dayKey)?.length || 0;
                    return { count, disabled: !count };
                  }}
                />

                {!monthHasSlots ? (
                  <div className="rounded-2xl border border-dashed border-olive-300/80 bg-olive-50/40 px-4 py-6 text-center">
                    <p className="font-medium text-graphite">Sem horários em {monthTitle(month).toLowerCase()}</p>
                    {nextDayKey ? (
                      <button
                        type="button"
                        onClick={() => goToDay(nextDayKey)}
                        className="mt-2 text-sm font-semibold text-olive-800 hover:underline"
                      >
                        Ver o próximo horário livre ({formatDayKey(nextDayKey, { day: "numeric", month: "long" })})
                      </button>
                    ) : null}
                  </div>
                ) : day && daySlots.length ? (
                  <section className="overflow-hidden rounded-2xl border border-olive-900/10 bg-linen/50">
                    <div className="flex items-center gap-2 border-b border-olive-900/10 bg-porcelain px-4 py-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                        <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-graphite">{formatDayHeading(daySlots[0].startsAt)}</p>
                        <p className="text-xs text-graphite/45">
                          {daySlots.length === 1 ? "1 horário livre" : `${daySlots.length} horários livres`}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4">
                      {daySlots.map((slot) => {
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
                ) : (
                  <p className="text-center text-sm text-graphite/55">Toque num dia marcado para ver os horários.</p>
                )}
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
              options={consultationPaymentOptions(payment.settings || {})}
              method={paymentMethod}
              onMethodChange={setPaymentMethod}
              coveredByPackage={usablePackage ? usablePackage.name : null}
            />
          </Card>
        </div>
      )}
    </PatientShell>
  );
}
