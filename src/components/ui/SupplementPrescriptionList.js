"use client";

import { Clock3, FileText, Layers, PackagePlus, Pill, Plus, Trash2 } from "lucide-react";
import { Card, btnSecondary, inputClassName } from "@/components/layout/AppShell";
import PresetPicker from "@/components/ui/PresetPicker";
import { mapSupplementPresetGroup } from "@/lib/presets/format";
import {
  countSupplementProducts,
  emptyGroupItem,
  emptySingleSupplement,
  emptySupplementGroup
} from "@/lib/diets/supplements";

function SupplementPreview({ entries }) {
  return (
    <Card className="overflow-hidden p-0 sm:sticky sm:top-5 sm:p-0">
      <div className="border-b border-olive-900/10 bg-gradient-to-br from-violet-50 to-porcelain px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700/70">
          Prévia para o paciente
        </p>
        <h3 className="mt-1 text-lg font-semibold text-graphite">Suplementação</h3>
      </div>
      <div className="space-y-4 p-4">
        {entries.length ? (
          entries.map((entry) =>
            entry.kind === "group" ? (
              <div
                key={entry.clientId}
                className="overflow-hidden rounded-xl border border-violet-200/80 bg-white"
              >
                <div className="flex items-center gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                    <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <p className="truncate text-sm font-semibold text-violet-950">
                    {entry.title || "Combo"}
                  </p>
                </div>
                <ul className="divide-y divide-violet-900/5">
                  {(entry.items || []).map((item, index) => (
                    <li
                      key={item.clientId}
                      className={`flex items-baseline justify-between gap-3 px-3 py-2 text-sm ${
                        index % 2 === 0 ? "bg-violet-50/45" : "bg-white"
                      }`}
                    >
                      <span className="min-w-0 truncate text-graphite">
                        <span className="mr-1.5 text-violet-400">•</span>
                        {item.productName || "—"}
                      </span>
                      <span className="shrink-0 tabular-nums font-medium text-violet-800">
                        {item.dosage || "—"}
                      </span>
                    </li>
                  ))}
                </ul>
                {entry.posology ? (
                  <div className="flex items-start gap-2 border-t border-violet-100 px-3 py-2.5 text-xs text-violet-900">
                    <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" strokeWidth={1.75} />
                    <p>
                      <span className="font-semibold">Posologia:</span> {entry.posology}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                key={entry.clientId}
                className="overflow-hidden rounded-xl border border-violet-200/80 bg-white"
              >
                <div className="flex items-center gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
                    <Pill className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <p className="truncate text-sm font-semibold text-violet-950">
                    {entry.productName || "Suplemento"}
                  </p>
                </div>
                <div className="space-y-1 px-3 py-2.5 text-sm">
                  <p className="font-medium tabular-nums text-violet-800">{entry.dosage || "—"}</p>
                  {entry.posology ? (
                    <p className="flex items-start gap-1.5 text-xs text-violet-900/80">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" strokeWidth={1.75} />
                      {entry.posology}
                    </p>
                  ) : null}
                </div>
              </div>
            )
          )
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

function ReadOnlySupplementView({ entries }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <SupplementPreview entries={entries} />
    </div>
  );
}

/**
 * Lista de suplementação: combos/grupos (pedido) + itens avulsos.
 */
export default function SupplementPrescriptionList({
  items = [],
  onChange,
  readOnly = false,
  patientName = ""
}) {
  const entries = items;
  const productCount = countSupplementProducts(entries);

  function updateEntries(next) {
    onChange?.(next);
  }

  function updateEntry(clientId, patch) {
    updateEntries(
      entries.map((entry) => (entry.clientId === clientId ? { ...entry, ...patch } : entry))
    );
  }

  function removeEntry(clientId) {
    updateEntries(entries.filter((entry) => entry.clientId !== clientId));
  }

  function updateGroupItem(groupId, itemId, patch) {
    updateEntries(
      entries.map((entry) => {
        if (entry.clientId !== groupId || entry.kind !== "group") return entry;
        return {
          ...entry,
          items: (entry.items || []).map((item) =>
            item.clientId === itemId ? { ...item, ...patch } : item
          )
        };
      })
    );
  }

  function addGroupItem(groupId) {
    updateEntries(
      entries.map((entry) => {
        if (entry.clientId !== groupId || entry.kind !== "group") return entry;
        return { ...entry, items: [...(entry.items || []), emptyGroupItem()] };
      })
    );
  }

  function removeGroupItem(groupId, itemId) {
    updateEntries(
      entries.map((entry) => {
        if (entry.clientId !== groupId || entry.kind !== "group") return entry;
        const nextItems = (entry.items || []).filter((item) => item.clientId !== itemId);
        return {
          ...entry,
          items: nextItems.length ? nextItems : [emptyGroupItem()]
        };
      })
    );
  }

  function applyPresets(presets, { values } = {}) {
    const mapped = presets.map((preset) => mapSupplementPresetGroup(preset, values || {}));
    updateEntries([...entries, ...mapped]);
  }

  if (readOnly) {
    return <ReadOnlySupplementView entries={entries} />;
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Pill className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="font-semibold text-graphite">Suplementação</h2>
              <p className="text-xs text-graphite/45">
                {productCount} {productCount === 1 ? "produto" : "produtos"}
                {entries.some((e) => e.kind === "group")
                  ? ` · ${entries.filter((e) => e.kind === "group").length} combo(s)`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnSecondary()}
              onClick={() => updateEntries([...entries, emptySupplementGroup()])}
            >
              <Layers className="h-4 w-4" strokeWidth={1.75} />
              Novo combo
            </button>
            <button
              type="button"
              className={btnSecondary()}
              onClick={() => updateEntries([...entries, emptySingleSupplement()])}
            >
              <Plus className="h-4 w-4" strokeWidth={1.75} />
              Avulso
            </button>
          </div>
        </div>

        <PresetPicker
          type="supplement_pack"
          label="Aplicar pacote como combo"
          patientContext={{ patientName }}
          onApply={applyPresets}
        />

        {!entries.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => updateEntries([emptySupplementGroup("Combo")])}
              className="flex flex-col items-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/40 px-6 py-12 text-center transition hover:border-violet-400 hover:bg-violet-50/70"
            >
              <Layers className="h-7 w-7 text-violet-600" strokeWidth={1.5} />
              <span className="mt-3 text-sm font-semibold text-graphite">Começar com um combo</span>
              <span className="mt-1 text-xs text-graphite/45">
                Vários produtos com a mesma posologia
              </span>
            </button>
            <button
              type="button"
              onClick={() => updateEntries([emptySingleSupplement()])}
              className="flex flex-col items-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/40 px-6 py-12 text-center transition hover:border-violet-400 hover:bg-violet-50/70"
            >
              <PackagePlus className="h-7 w-7 text-violet-600" strokeWidth={1.5} />
              <span className="mt-3 text-sm font-semibold text-graphite">Adicionar avulso</span>
              <span className="mt-1 text-xs text-graphite/45">Um suplemento individual</span>
            </button>
          </div>
        ) : null}

        {entries.map((entry) =>
          entry.kind === "group" ? (
            <Card
              key={entry.clientId}
              className="overflow-hidden border-violet-200/80 p-0 sm:p-0"
            >
              <div className="flex items-center justify-between gap-3 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-violet-950 outline-none placeholder:text-violet-800/35"
                    value={entry.title || ""}
                    onChange={(event) =>
                      updateEntry(entry.clientId, { title: event.target.value })
                    }
                    placeholder="Nome do combo"
                  />
                </div>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeEntry(entry.clientId)}
                  aria-label="Remover combo"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </div>

              <div className="divide-y divide-violet-900/5">
                {(entry.items || []).map((item, index) => (
                  <div
                    key={item.clientId}
                    className={`grid gap-2 px-4 py-2.5 sm:grid-cols-[1fr_120px_auto] ${
                      index % 2 === 0 ? "bg-violet-50/40" : "bg-white"
                    }`}
                  >
                    <input
                      className={`${inputClassName()} !h-9 !rounded-lg !px-2.5 !text-sm`}
                      value={item.productName}
                      onChange={(event) =>
                        updateGroupItem(entry.clientId, item.clientId, {
                          productName: event.target.value
                        })
                      }
                      placeholder="Produto"
                    />
                    <input
                      className={`${inputClassName()} !h-9 !rounded-lg !px-2.5 !text-sm`}
                      value={item.dosage}
                      onChange={(event) =>
                        updateGroupItem(entry.clientId, item.clientId, {
                          dosage: event.target.value
                        })
                      }
                      placeholder="Dosagem"
                    />
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-700"
                      onClick={() => removeGroupItem(entry.clientId, item.clientId)}
                      aria-label="Remover item do combo"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-violet-100 bg-white px-4 py-3">
                <button
                  type="button"
                  className="text-xs font-semibold text-violet-800 hover:underline"
                  onClick={() => addGroupItem(entry.clientId)}
                >
                  + Item no combo
                </button>
                <label className="block text-xs font-medium text-graphite/55">
                  Posologia do combo
                  <div className="relative mt-1">
                    <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
                    <input
                      className={`${inputClassName()} !pl-9`}
                      value={entry.posology || ""}
                      onChange={(event) =>
                        updateEntry(entry.clientId, { posology: event.target.value })
                      }
                      placeholder="Ex.: 1 dose no café da manhã"
                    />
                  </div>
                </label>
              </div>
            </Card>
          ) : (
            <Card
              key={entry.clientId}
              className="overflow-hidden border-violet-200/80 p-0 sm:p-0"
            >
              <div className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 to-white px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <Pill className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </span>
                  <p className="truncate text-sm font-semibold text-violet-950">
                    {entry.productName || "Novo suplemento"}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition hover:bg-red-50 hover:text-red-700"
                  onClick={() => removeEntry(entry.clientId)}
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
                      value={entry.productName}
                      onChange={(event) =>
                        updateEntry(entry.clientId, { productName: event.target.value })
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
                      value={entry.dosage}
                      onChange={(event) =>
                        updateEntry(entry.clientId, { dosage: event.target.value })
                      }
                      placeholder="Ex.: 30 g"
                    />
                  </label>
                  <label className="block text-xs text-graphite/55">
                    Posologia
                    <div className="relative mt-1">
                      <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
                      <input
                        className={`${inputClassName()} !pl-9`}
                        value={entry.posology}
                        onChange={(event) =>
                          updateEntry(entry.clientId, { posology: event.target.value })
                        }
                        placeholder="Ex.: 1x ao dia"
                      />
                    </div>
                  </label>
                </div>

                <label className="block text-xs text-graphite/55">
                  Observações
                  <div className="relative mt-1">
                    <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-300" />
                    <input
                      className={`${inputClassName()} !pl-9`}
                      value={entry.notes || ""}
                      onChange={(event) =>
                        updateEntry(entry.clientId, { notes: event.target.value })
                      }
                      placeholder="Opcional"
                    />
                  </div>
                </label>
              </div>
            </Card>
          )
        )}
      </div>

      <SupplementPreview entries={entries} />
    </div>
  );
}

export { emptySingleSupplement as emptySupplement };
