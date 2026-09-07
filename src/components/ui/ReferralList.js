"use client";

import {
  AlertTriangle,
  FileText,
  Plus,
  Stethoscope,
  Trash2,
  UserRound,
  UserRoundPlus
} from "lucide-react";
import { Card, btnSecondary, inputClassName } from "@/components/layout/AppShell";

function emptyReferral() {
  return {
    clientId: crypto.randomUUID(),
    specialty: "",
    professionalName: "",
    reason: "",
    urgency: "routine",
    notes: ""
  };
}

/**
 * Lista de encaminhamentos para outros profissionais de saúde.
 */
export default function ReferralList({ items = [], onChange }) {
  function updateItem(clientId, patch) {
    onChange?.(items.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }

  function removeItem(clientId) {
    onChange?.(items.filter((item) => item.clientId !== clientId));
  }

  function addItem() {
    onChange?.([...items, emptyReferral()]);
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Stethoscope className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-semibold text-graphite">Encaminhamentos</h2>
              <p className="text-xs text-graphite/45">
                {items.length} {items.length === 1 ? "profissional" : "profissionais"}
              </p>
            </div>
          </div>
          <button type="button" className={btnSecondary()} onClick={addItem}>
            <Plus className="h-4 w-4" strokeWidth={1.75} />
            Adicionar
          </button>
        </div>

        {!items.length ? (
          <button
            type="button"
            onClick={addItem}
            className="flex w-full flex-col items-center rounded-2xl border border-dashed border-sky-300 bg-sky-50/35 px-6 py-14 text-center transition hover:border-sky-400 hover:bg-sky-50/70"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
              <UserRoundPlus className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <span className="mt-3 text-sm font-semibold text-graphite">
              Adicionar primeiro encaminhamento
            </span>
          </button>
        ) : null}

        {items.map((item, index) => (
          <Card key={item.clientId} className="overflow-hidden border-sky-200/70 p-0 sm:p-0">
            <div className="flex items-center justify-between border-b border-sky-100 bg-gradient-to-r from-sky-50/90 to-white px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="max-w-[300px] truncate text-sm font-semibold text-graphite">
                  {item.specialty || "Novo encaminhamento"}
                </p>
                {item.urgency === "priority" ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Prioritário
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-700"
                onClick={() => removeItem(item.clientId)}
                aria-label="Remover encaminhamento"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label className="block text-xs text-graphite/55">
                  Especialidade
                  <div className="relative mt-1">
                    <Stethoscope className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
                    <input
                      className={`${inputClassName()} !pl-9`}
                      value={item.specialty}
                      onChange={(event) =>
                        updateItem(item.clientId, { specialty: event.target.value })
                      }
                      placeholder="Ex.: Endocrinologista"
                    />
                  </div>
                </label>

                <div className="block text-xs text-graphite/55">
                  Urgência
                  <div className="mt-1 flex overflow-hidden rounded-xl border border-olive-900/10 bg-white">
                    {[
                      { id: "routine", label: "Rotina" },
                      { id: "priority", label: "Prioritário" }
                    ].map((option) => {
                      const active = item.urgency === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => updateItem(item.clientId, { urgency: option.id })}
                          className={`px-3 py-2.5 text-xs font-medium transition ${
                            active
                              ? option.id === "priority"
                                ? "bg-amber-500 text-white"
                                : "bg-sky-700 text-white"
                              : "text-graphite/55 hover:bg-linen"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <label className="block text-xs text-graphite/55">
                Motivo
                <div className="relative mt-1">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/30" />
                  <input
                    className={`${inputClassName()} !pl-9`}
                    value={item.reason}
                    onChange={(event) =>
                      updateItem(item.clientId, { reason: event.target.value })
                    }
                    placeholder="Motivo do encaminhamento"
                  />
                </div>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-graphite/55">
                  Profissional
                  <div className="relative mt-1">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/30" />
                    <input
                      className={`${inputClassName()} !pl-9`}
                      value={item.professionalName || ""}
                      onChange={(event) =>
                        updateItem(item.clientId, { professionalName: event.target.value })
                      }
                      placeholder="Opcional"
                    />
                  </div>
                </label>
                <label className="block text-xs text-graphite/55">
                  Observações
                  <input
                    className={`mt-1 ${inputClassName()}`}
                    value={item.notes || ""}
                    onChange={(event) => updateItem(item.clientId, { notes: event.target.value })}
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0 sm:sticky sm:top-5 sm:p-0">
        <div className="border-b border-olive-900/10 bg-gradient-to-br from-sky-50 to-porcelain px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700/70">
            Prévia para o paciente
          </p>
          <h3 className="mt-1 text-lg font-semibold text-graphite">Encaminhamentos</h3>
        </div>
        <div className="space-y-3 p-4">
          {items.length ? (
            items.map((item, index) => (
              <div
                key={item.clientId}
                className="rounded-xl border border-sky-100 bg-white px-3.5 py-3"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                    <Stethoscope className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-graphite">
                        {item.specialty || `Encaminhamento ${index + 1}`}
                      </p>
                      {item.urgency === "priority" ? (
                        <AlertTriangle
                          className="h-4 w-4 shrink-0 text-amber-500"
                          strokeWidth={1.75}
                        />
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-graphite/55">
                      {item.reason || "Motivo do encaminhamento"}
                    </p>
                    {item.professionalName ? (
                      <p className="mt-1.5 text-[11px] font-medium text-sky-700">
                        {item.professionalName}
                      </p>
                    ) : null}
                    {item.notes ? (
                      <p className="mt-1.5 border-t border-olive-900/6 pt-1.5 text-[11px] text-graphite/45">
                        {item.notes}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center">
              <Stethoscope
                className="mx-auto h-6 w-6 text-graphite/20"
                strokeWidth={1.5}
              />
              <p className="mt-2 text-xs text-graphite/40">Nenhum encaminhamento</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export { emptyReferral };
