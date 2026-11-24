"use client";

import { Pill } from "lucide-react";
import PresetPicker from "@/components/ui/PresetPicker";
import SupplementEntriesEditor, { SupplementAddButtons, SupplementPreview } from "@/components/ui/SupplementEntriesEditor";
import { mapSupplementPresetEntries } from "@/lib/presets/supplements";
import { countSupplementProducts, emptySingleSupplement } from "@/lib/diets/supplements";

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

  function applyPresets(presets, { values } = {}) {
    const mapped = presets.flatMap((preset) => mapSupplementPresetEntries(preset, values || {}));
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
          <SupplementAddButtons entries={entries} onChange={updateEntries} />
        </div>

        <PresetPicker
          type="supplement_pack"
          label="Aplicar preset de suplementação"
          patientContext={{ patientName }}
          onApply={applyPresets}
        />

        <SupplementEntriesEditor entries={entries} onChange={updateEntries} />
      </div>

      <SupplementPreview entries={entries} />
    </div>
  );
}

export { emptySingleSupplement as emptySupplement };
