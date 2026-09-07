"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Clock } from "lucide-react";
import PatientShell from "@/components/layout/PatientShell";
import { Card } from "@/components/layout/AppShell";
import BookingPaymentPanel from "@/components/ui/BookingPaymentPanel";

function formatSlotTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDayHeading(iso) {
  const label = new Date(iso).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function groupSlotsByDay(slots) {
  const groups = new Map();

  for (const slot of slots) {
    const key = new Date(slot.startsAt).toISOString().slice(0, 10);
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

  const slotGroups = useMemo(() => groupSlotsByDay(slots.slice(0, 24)), [slots]);
  const selectedDate = selected ? new Date(selected) : null;

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);

    Promise.all([
      fetch(`/api/appointments/slots?from=${from.toISOString()}&to=${to.toISOString()}`).then((r) => r.json()),
      fetch("/api/payment-info").then((r) => r.json())
    ]).then(([slotsRes, paymentRes]) => {
      setSlots(slotsRes.slots || []);
      setPayment(paymentRes);
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
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold text-graphite">Horários disponíveis</h2>
              <p className="mt-1 text-sm text-graphite/60">Consulta de 60 min · intervalo de 15 min entre sessões</p>
            </div>
            {selectedDate ? (
              <div className="inline-flex items-center gap-2 rounded-xl bg-olive-100 px-3 py-2 text-sm font-medium text-olive-800">
                <Check className="h-4 w-4" />
                {formatDayHeading(selected)} · {formatSlotTime(selected)}
              </div>
            ) : null}
          </div>

          {slotGroups.length ? (
            <div className="mt-6 space-y-5">
              {slotGroups.map((group) => (
                <section key={group.key} className="overflow-hidden rounded-2xl border border-olive-900/10 bg-linen/50">
                  <div className="flex items-center gap-2 border-b border-olive-900/10 bg-porcelain px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                      <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-graphite">{formatDayHeading(group.startsAt)}</p>
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
                              ? "border-olive-700 bg-olive-700 text-white shadow-sm"
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
              selectedDate
                ? { day: formatDayHeading(selected), time: formatSlotTime(selected) }
                : null
            }
            loading={loading}
            disabled={!selected}
            feedback={feedback}
            onConfirm={book}
          />
        </Card>
      </div>
    </PatientShell>
  );
}
