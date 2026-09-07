"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Clock, Plus, Repeat, Trash2 } from "lucide-react";
import AdminShell from "@/components/layout/AdminShell";
import { Card, btnPrimary, inputClassName } from "@/components/layout/AppShell";

const weekdays = [
  { value: 0, short: "Dom", label: "Domingo" },
  { value: 1, short: "Seg", label: "Segunda" },
  { value: 2, short: "Ter", label: "Terça" },
  { value: 3, short: "Qua", label: "Quarta" },
  { value: 4, short: "Qui", label: "Quinta" },
  { value: 5, short: "Sex", label: "Sexta" },
  { value: 6, short: "Sáb", label: "Sábado" }
];

function formatTime(value) {
  return value?.slice(0, 5) || "—";
}

function monthLabel() {
  const label = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function DisponibilidadePage() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState({ weekday: 1, startTime: "09:00", endTime: "17:00" });
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const rulesByWeekday = useMemo(() => {
    const map = new Map();
    for (const day of weekdays) map.set(day.value, []);
    for (const rule of rules) {
      if (!map.has(rule.weekday)) map.set(rule.weekday, []);
      map.get(rule.weekday).push(rule);
    }
    return map;
  }, [rules]);

  async function load() {
    const res = await fetch("/api/admin/availability");
    const data = await res.json();
    setRules(data.rules || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addRule() {
    setSaving(true);
    setFeedback("");
    setError("");

    if (form.startTime >= form.endTime) {
      setError("O horário final deve ser depois do inicial.");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    setSaving(false);

    if (!res.ok) {
      setError("Não foi possível salvar o horário.");
      return;
    }

    setFeedback("Horário adicionado. Vale para todo o mês, em todas as semanas.");
    load();
  }

  async function removeRule(id) {
    await fetch(`/api/admin/availability?id=${id}`, { method: "DELETE" });
    setFeedback("Horário removido.");
    load();
  }

  return (
    <AdminShell
      title="Disponibilidade"
      subtitle="Horários fixos que se repetem automaticamente em todo o mês"
      breadcrumbs={["Admin", "Agenda", "Disponibilidade"]}
      userName="Letícia"
    >
      <div className="mb-6 overflow-hidden rounded-2xl border border-olive-200/80 bg-gradient-to-r from-olive-700 to-olive-800 p-5 text-white shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
              <Repeat className="h-3.5 w-3.5" />
              Padrão mensal recorrente
            </div>
            <h2 className="mt-3 text-xl font-semibold">Agenda de {monthLabel()}</h2>
            <p className="mt-2 text-sm leading-6 text-olive-100/90">
              Configure uma vez os dias e horários em que você atende. O sistema repete esse padrão em{" "}
              <strong className="font-semibold text-white">todas as semanas do mês</strong> — não é necessário
              reconfigurar semana a semana.
            </p>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <CalendarClock className="h-7 w-7" strokeWidth={1.75} />
          </div>
        </div>
      </div>

      <Card className="mb-6" title="Visão do mês">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekdays.map((day) => {
            const dayRules = rulesByWeekday.get(day.value) || [];
            const hasRules = dayRules.length > 0;

            return (
              <div
                key={day.value}
                className={`rounded-2xl border p-3 transition ${
                  hasRules
                    ? "border-olive-300 bg-olive-50/80"
                    : "border-olive-900/10 bg-linen/50"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-graphite/45">{day.short}</p>
                <p className="mt-1 text-sm font-semibold text-graphite">{day.label}</p>
                <div className="mt-3 space-y-1">
                  {hasRules ? (
                    dayRules.map((rule) => (
                      <p
                        key={rule.id}
                        className="inline-flex w-full items-center gap-1 rounded-lg bg-white/80 px-2 py-1 text-xs font-medium text-olive-800"
                      >
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatTime(rule.start_time)} – {formatTime(rule.end_time)}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs text-graphite/40">Sem atendimento</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="text-base font-semibold text-graphite">Adicionar horário fixo</h2>
        <p className="mt-1 text-sm text-graphite/55">
          Escolha o dia da semana e o intervalo. O horário valerá para todas as ocorrências desse dia no mês.
        </p>

        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-graphite/70">Dia da semana</p>
          <div className="flex flex-wrap gap-2">
            {weekdays.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setForm((current) => ({ ...current, weekday: day.value }))}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  form.weekday === day.value
                    ? "border-olive-700 bg-olive-700 text-white shadow-sm"
                    : "border-olive-900/10 bg-white text-graphite hover:border-olive-400 hover:bg-olive-50/70"
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-graphite/70">Início</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-graphite/70">Fim</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => setForm((current) => ({ ...current, endTime: e.target.value }))}
              className={inputClassName()}
            />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={addRule} disabled={saving} className={btnPrimary("w-full gap-2")}>
              <Plus className="h-4 w-4" />
              {saving ? "Salvando..." : "Adicionar horário"}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        {feedback ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </p>
        ) : null}
      </Card>

      <Card title="Horários configurados">
        {!rules.length ? (
          <div className="rounded-2xl border border-dashed border-olive-300/70 bg-linen/60 px-4 py-10 text-center">
            <p className="font-medium text-graphite">Nenhum horário configurado</p>
            <p className="mt-2 text-sm text-graphite/55">
              Adicione os dias de atendimento acima para liberar agendamentos no portal do paciente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => {
              const day = weekdays.find((item) => item.value === rule.weekday);

              return (
                <article
                  key={rule.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-olive-900/10 bg-linen/50 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                      <Clock className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="font-semibold text-graphite">{day?.label || "Dia"}</p>
                      <p className="text-sm text-graphite/55">
                        {formatTime(rule.start_time)} – {formatTime(rule.end_time)}
                      </p>
                      <p className="mt-1 text-xs text-olive-700">Repete todo mês neste dia da semana</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRule(rule.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
