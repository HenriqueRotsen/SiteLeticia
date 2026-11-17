"use client";

// A nutricionista marca uma consulta para o paciente: modalidade (online/presencial),
// tipo, dia e horário (sugere os horários livres, mas aceita qualquer horário).

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock, MapPin, MessageCircle, Video } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { btnPrimary, btnSecondary } from "@/components/layout/AppShell";
import { TIMEZONE } from "@/lib/constants";
import { formatAppointmentDateTime } from "@/lib/datetime";
import { formatAddress, isAddressComplete } from "@/lib/appointments/location";
import { zonedDateKey, zonedTimeToUtc } from "@/lib/scheduling/timezone";

const inputClass =
  "mt-1 w-full rounded-xl border border-olive-900/15 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-olive-500 focus:ring-2 focus:ring-olive-200";

function todayKey() {
  return zonedDateKey(new Date(), TIMEZONE);
}

function slotTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-BR", { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" });
}

function toIso(dateKey, time) {
  if (!dateKey || !/^\d{2}:\d{2}$/.test(time || "")) return null;
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return zonedTimeToUtc({ year, month, day, hour, minute }, TIMEZONE).toISOString();
}

function ModalityOption({ active, icon: Icon, title, description, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? "border-olive-700 bg-olive-50 ring-2 ring-olive-200"
          : "border-olive-900/10 bg-white hover:border-olive-400"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          active ? "bg-olive-700 text-white" : "bg-linen text-olive-800"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span className="min-w-0">
        <span className="block font-semibold text-graphite">{title}</span>
        <span className="mt-0.5 block text-xs leading-5 text-graphite/55">{description}</span>
      </span>
    </button>
  );
}

export default function ScheduleAppointmentModal({ open, onClose, patient = null, onScheduled }) {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState(patient?.id || "");
  const [modality, setModality] = useState("online");
  const [type, setType] = useState("consultation");
  const [dateKey, setDateKey] = useState(todayKey());
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [address, setAddress] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError("");
    setTime("");
    setPatientId(patient?.id || "");

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 45);
    const requests = [
      fetch("/api/admin/clinic-address").then((r) => r.json()).catch(() => ({})),
      fetch(`/api/appointments/slots?from=${from.toISOString()}&to=${to.toISOString()}`)
        .then((r) => r.json())
        .catch(() => ({}))
    ];
    if (!patient) requests.push(fetch("/api/admin/patients").then((r) => r.json()).catch(() => ({})));

    Promise.all(requests).then(([addressData, slotsData, patientsData]) => {
      setAddress(addressData?.address || null);
      setSlots(slotsData?.slots || []);
      if (patientsData) {
        const list = (patientsData.patients || []).slice().sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
        setPatients(list);
      }
      const first = (slotsData?.slots || [])[0];
      if (first) setDateKey(zonedDateKey(new Date(first.startsAt), TIMEZONE));
    });
  }, [open, patient]);

  const daySlots = useMemo(
    () => slots.filter((slot) => zonedDateKey(new Date(slot.startsAt), TIMEZONE) === dateKey),
    [slots, dateKey]
  );
  const hasAddress = isAddressComplete(address);
  const startsAt = toIso(dateKey, time);
  const selectedPatient = patient || patients.find((item) => item.id === patientId) || null;
  const canSubmit = Boolean(selectedPatient && startsAt && (modality === "online" || hasAddress)) && !saving;

  async function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: selectedPatient.id, startsAt, type, modality })
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.message || "Não foi possível marcar a consulta.");
      return;
    }
    setResult(data);
    onScheduled?.(data.appointment);
  }

  if (result) {
    const appt = result.appointment;
    return (
      <Modal open={open} onClose={onClose} title="Consulta marcada" size="md">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive-100 text-olive-800">
            <Check className="h-5 w-5" />
          </span>
          <div className="min-w-0 text-sm leading-6 text-graphite/75">
            <p className="font-semibold text-graphite">
              {selectedPatient?.full_name} · {formatAppointmentDateTime(appt.starts_at)}
            </p>
            <p>
              {appt.modality === "in_person" ? `Presencial — ${appt.location}` : "Online, pelo Google Meet"}
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-graphite/65">
              <li>Já aparece na área do paciente.</li>
              {result.usedPackage ? <li>Paga com o pacote “{result.usedPackage.name}”.</li> : null}
              {result.calendarWarning ? (
                <li className="text-amber-800">{result.calendarWarning}</li>
              ) : (
                <li>Evento criado no Google Agenda{result.emailSent || result.hasAccount ? " com convite para o paciente" : ""}.</li>
              )}
              {result.emailSent ? <li>Paciente avisado por e-mail.</li> : null}
              {!result.hasAccount ? <li>Paciente ainda não tem conta: avise pelo WhatsApp.</li> : null}
            </ul>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={btnSecondary()}>
            Fechar
          </button>
          {result.whatsappHref ? (
            <a href={result.whatsappHref} target="_blank" rel="noopener noreferrer" className={btnPrimary()}>
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
              {appt.modality === "in_person" ? "Enviar localização no WhatsApp" : "Avisar no WhatsApp"}
            </a>
          ) : null}
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Marcar consulta" size="md">
      <form onSubmit={submit} className="space-y-5">
        {patient ? (
          <p className="text-sm text-graphite/60">
            Paciente: <span className="font-semibold text-graphite">{patient.full_name}</span>
          </p>
        ) : (
          <label className="block text-sm font-medium text-graphite">
            Paciente
            <select className={inputClass} value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="">Escolha o paciente…</option>
              {patients.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <div>
          <p className="text-sm font-medium text-graphite">Modalidade</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <ModalityOption
              active={modality === "online"}
              icon={Video}
              title="Online"
              description="Cria o link do Google Meet."
              onClick={() => setModality("online")}
            />
            <ModalityOption
              active={modality === "in_person"}
              icon={MapPin}
              title="Presencial"
              description={hasAddress ? formatAddress(address) : "Cadastre o endereço primeiro."}
              onClick={() => setModality("in_person")}
            />
          </div>
          {modality === "in_person" && !hasAddress ? (
            <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Falta o endereço de atendimento.{" "}
              <Link href="/admin/configuracoes/atendimento" className="font-semibold underline">
                Cadastrar agora
              </Link>
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-graphite">
            Tipo
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="consultation">Consulta</option>
              <option value="return">Retorno</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-graphite">
            Dia
            <input
              type="date"
              className={inputClass}
              value={dateKey}
              min={todayKey()}
              onChange={(e) => {
                setDateKey(e.target.value);
                setTime("");
              }}
              required
            />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium text-graphite">Horário</p>
          {daySlots.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {daySlots.map((slot) => {
                const value = slotTime(slot.startsAt);
                const active = time === value;
                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    onClick={() => setTime(value)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-olive-700 bg-olive-700 text-white"
                        : "border-olive-900/10 bg-white text-graphite hover:border-olive-400"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 opacity-80" />
                    {value}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-1 text-xs text-graphite/50">Nenhum horário livre da agenda nesse dia. Informe o horário abaixo.</p>
          )}
          <label className="mt-3 block text-xs text-graphite/55">
            Ou outro horário
            <input
              type="time"
              className={`${inputClass} max-w-[10rem]`}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              step={300}
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t border-olive-900/10 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={btnSecondary()}>
            Cancelar
          </button>
          <button type="submit" disabled={!canSubmit} className={btnPrimary()}>
            {saving ? "Marcando…" : "Marcar consulta"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
