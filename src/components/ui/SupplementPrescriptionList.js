"use client";

import { Clock3, FileText, PackagePlus, Pill, Plus, Trash2 } from "lucide-react";
import { Card, btnSecondary, inputClassName } from "@/components/layout/AppShell";

function emptySupplement() {
  return {
    clientId: crypto.randomUUID(),
    productName: "",
    dosage: "",
    posology: "",
    notes: ""
  };
}

function SupplementPreview({ items, readOnly }) {
  return (
    <Card className={`overflow-hidden p-0 ${readOnly ? "" : "sm:sticky sm:top-5"} sm:p-0`}>
      <div className="border-b border-olive-900/10 bg-gradient-to-br from-violet-50 to-porcelain px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700/70">
          {readOnly ? "Prescrição" : "Prévia para o paciente"}
        </p>
        <h3 className="mt-1 text-lg font-semibold text-graphite">Suplementação</h3>
      </div>
      <div className="space-y-3 p-4">
        {items.length ? (
          items.map((item, index) => (
            <div
              key={item.clientId}
              className="rounded-xl border border-violet-100 bg-white px-3.5 py-3"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                  <Pill className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-graphite">
                    {item.productName || `Suplemento ${index + 1}`}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-violet-700">
                    {item.dosage || "—"}
                  </p>
                  <p className="mt-1 text-xs text-graphite/55">{item.posology || "—"}</p>
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
            <Pill className="mx-auto h-6 w-6 text-graphite/20" strokeWidth={1.5} />
            <p className="mt-2 text-xs text-graphite/40">Nenhum suplemento</p>
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Lista de suplementos no formato de receituário (produto, dosagem, posologia).
 */
export default function SupplementPrescriptionList({ items = [], onChange, readOnly = false }) {
  function updateItem(clientId, patch) {
    onChange?.(items.map((item) => (item.clientId === clientId ? { ...item, ...patch } : item)));
  }

  function removeItem(clientId) {
    onChange?.(items.filter((item) => item.clientId !== clientId));
  }

  function addItem() {
    onChange?.([...items, emptySupplement()]);
  }

  if (readOnly) {
    return (
      <div className="mx-auto max-w-2xl">
        <SupplementPreview items={items} readOnly />
      </div>
    );
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Pill className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-semibold text-graphite">Suplementação</h2>
              <p className="text-xs text-graphite/45">
                {items.length} {items.length === 1 ? "produto" : "produtos"}
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
            className="flex w-full flex-col items-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/35 px-6 py-14 text-center transition hover:border-violet-400 hover:bg-violet-50/70"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
              <PackagePlus className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <span className="mt-3 text-sm font-semibold text-graphite">
              Adicionar primeiro suplemento
            </span>
          </button>
        ) : null}

        {items.map((item, index) => (
          <Card
            key={item.clientId}
            className="overflow-hidden border-violet-200/70 p-0 sm:p-0"
          >
            <div className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50/90 to-white px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p className="max-w-[300px] truncate text-sm font-semibold text-graphite">
                  {item.productName || "Novo suplemento"}
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-700"
                onClick={() => removeItem(item.clientId)}
                aria-label="Remover suplemento"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <label className="block text-xs font-medium text-graphite/55">
                Produto
                <div className="relative mt-1">
                  <Pill className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
                  <input
                    className={`${inputClassName()} !pl-9`}
                    value={item.productName}
                    onChange={(event) =>
                      updateItem(item.clientId, { productName: event.target.value })
                    }
                    placeholder="Ex.: Whey Protein Isolado"
                  />
                </div>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-graphite/55">
                  Dosagem
                  <input
                    className={`mt-1 ${inputClassName()}`}
                    value={item.dosage}
                    onChange={(event) => updateItem(item.clientId, { dosage: event.target.value })}
                    placeholder="Ex.: 30 g"
                  />
                </label>
                <label className="block text-xs text-graphite/55">
                  Posologia
                  <div className="relative mt-1">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/30" />
                    <input
                      className={`${inputClassName()} !pl-9`}
                      value={item.posology}
                      onChange={(event) =>
                        updateItem(item.clientId, { posology: event.target.value })
                      }
                      placeholder="Ex.: 1x ao dia, após o treino"
                    />
                  </div>
                </label>
              </div>

              <label className="block text-xs text-graphite/55">
                Observações
                <div className="relative mt-1">
                  <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/30" />
                  <input
                    className={`${inputClassName()} !pl-9`}
                    value={item.notes || ""}
                    onChange={(event) =>
                      updateItem(item.clientId, { notes: event.target.value })
                    }
                    placeholder="Opcional"
                  />
                </div>
              </label>
            </div>
          </Card>
        ))}
      </div>

      <SupplementPreview items={items} />
    </div>
  );
}

export { emptySupplement };
