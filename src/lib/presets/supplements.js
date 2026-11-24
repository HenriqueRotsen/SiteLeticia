// Presets de suplementação com combos (vários componentes numa cápsula, uma posologia)
// e itens avulsos — o mesmo formato da suplementação da dieta.
//
// Formato novo: content = { entries: [single | group], notes }
// Formato antigo: content = { items: [...], packPosology, notes } — vira um combo só,
// do mesmo jeito que a dieta sempre aplicou esses presets.

import { cleanPresetText } from "@/lib/presets/format";
import { fillVariables } from "@/lib/presets/variables";

function newId() {
  return crypto.randomUUID();
}

function normalizeGroupItem(item = {}) {
  return {
    clientId: item.clientId || newId(),
    productName: item.productName || "",
    dosage: item.dosage || "",
    notes: item.notes || ""
  };
}

function normalizeEntry(entry = {}) {
  if (entry.kind === "group") {
    const items = (entry.items || []).map(normalizeGroupItem);
    return {
      kind: "group",
      clientId: entry.clientId || newId(),
      title: entry.title || "Combo",
      posology: entry.posology || "",
      notes: entry.notes || "",
      items: items.length ? items : [normalizeGroupItem()]
    };
  }
  return {
    kind: "single",
    clientId: entry.clientId || newId(),
    productName: entry.productName || "",
    dosage: entry.dosage || "",
    posology: entry.posology || "",
    notes: entry.notes || ""
  };
}

export function isLegacySupplementContent(content = {}) {
  return !Array.isArray(content?.entries) && Array.isArray(content?.items);
}

/** Entradas (combos + avulsos) de um preset, em qualquer formato. */
export function presetSupplementEntries(content = {}, title = "Combo") {
  if (Array.isArray(content?.entries)) return content.entries.map(normalizeEntry);

  const items = (content?.items || []).filter((item) => String(item?.productName || "").trim());
  if (!items.length) return [];
  const posology =
    content.packPosology || items.find((item) => String(item.posology || "").trim())?.posology || "";

  if (items.length === 1 && !content.packPosology) {
    const [item] = items;
    return [normalizeEntry({ kind: "single", ...item })];
  }

  return [
    normalizeEntry({
      kind: "group",
      title: title || "Combo",
      posology,
      items: items.map((item) => ({ productName: item.productName, dosage: item.dosage, notes: item.notes }))
    })
  ];
}

/** Conteúdo salvo do preset (formato novo). */
export function supplementPresetContent(entries = [], notes = "") {
  return {
    entries: entries.map((entry) => {
      const normalized = normalizeEntry(entry);
      if (normalized.kind === "group") {
        const { clientId: _id, ...group } = normalized;
        return { ...group, items: group.items.map(({ clientId: _itemId, ...item }) => item) };
      }
      const { clientId: _id, ...single } = normalized;
      return single;
    }),
    notes: notes || ""
  };
}

export function countPresetSupplements(content = {}) {
  const entries = presetSupplementEntries(content);
  return {
    combos: entries.filter((entry) => entry.kind === "group").length,
    products: entries.reduce((sum, entry) => sum + (entry.kind === "group" ? entry.items.length : 1), 0)
  };
}

/** Aplica o preset na dieta: entradas prontas (variáveis preenchidas, ids novos). */
export function mapSupplementPresetEntries(preset, variableValues = {}) {
  const filled = fillVariables(preset?.content || {}, variableValues);
  const title = cleanPresetText(fillVariables(preset?.title || "Combo", variableValues));
  const notes = cleanPresetText(filled.notes || "");

  return presetSupplementEntries(filled, title).map((entry) => {
    if (entry.kind === "group") {
      return {
        kind: "group",
        clientId: newId(),
        title: cleanPresetText(entry.title) || title,
        posology: cleanPresetText(entry.posology),
        notes: cleanPresetText(entry.notes || notes),
        items: entry.items.map((item) => ({
          clientId: newId(),
          productName: cleanPresetText(item.productName),
          dosage: cleanPresetText(item.dosage),
          notes: cleanPresetText(item.notes)
        }))
      };
    }
    return {
      kind: "single",
      clientId: newId(),
      productName: cleanPresetText(entry.productName),
      dosage: cleanPresetText(entry.dosage),
      posology: cleanPresetText(entry.posology),
      notes: cleanPresetText(entry.notes || notes)
    };
  });
}

/** Texto pesquisável do preset (nomes, produtos, exames, especialidade…). */
export function presetSearchText(preset = {}) {
  const content = preset.content || {};
  const parts = [preset.title];
  if (preset.type === "supplement_pack") {
    for (const entry of presetSupplementEntries(content, preset.title)) {
      if (entry.kind === "group") parts.push(entry.title, ...entry.items.map((item) => item.productName));
      else parts.push(entry.productName);
    }
  } else if (preset.type === "exam_order") {
    parts.push(...(content.exams || []).map((exam) => exam.name));
  } else {
    parts.push(content.specialty, content.reason);
  }
  return parts.filter(Boolean).join(" ");
}
