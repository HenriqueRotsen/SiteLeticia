import { describe, expect, it } from "vitest";
import {
  countPresetSupplements,
  mapSupplementPresetEntries,
  presetSearchText,
  presetSupplementEntries,
  supplementPresetContent
} from "@/lib/presets/supplements";

const legacy = {
  items: [
    { productName: "Nutricolin", dosage: "300 mg", posology: "1 dose no café da manhã", notes: "" },
    { productName: "Dimpless", dosage: "40 mg", posology: "1 dose no café da manhã", notes: "" }
  ],
  packPosology: "",
  notes: "Para {{paciente}}"
};

describe("presetSupplementEntries", () => {
  it("turns an old preset into one combo, as the diet already did", () => {
    const [entry, ...rest] = presetSupplementEntries(legacy, "Cabelos e Unhas");
    expect(rest).toHaveLength(0);
    expect(entry).toMatchObject({ kind: "group", title: "Cabelos e Unhas", posology: "1 dose no café da manhã" });
    expect(entry.items.map((item) => item.productName)).toEqual(["Nutricolin", "Dimpless"]);
  });

  it("keeps a lone old item as a standalone supplement", () => {
    const [entry] = presetSupplementEntries({ items: [{ productName: "Creatina", dosage: "5 g", posology: "1x ao dia" }] });
    expect(entry).toMatchObject({ kind: "single", productName: "Creatina", posology: "1x ao dia" });
  });

  it("reads the new format with combos and standalone items", () => {
    const entries = presetSupplementEntries({
      entries: [
        { kind: "group", title: "Cápsula manhã", posology: "1 cápsula", items: [{ productName: "A", dosage: "1 mg" }] },
        { kind: "single", productName: "Creatina", dosage: "5 g", posology: "1x ao dia" }
      ]
    });
    expect(entries.map((e) => e.kind)).toEqual(["group", "single"]);
    expect(entries.every((e) => e.clientId)).toBe(true);
  });
});

describe("supplementPresetContent", () => {
  it("saves without client ids", () => {
    const saved = supplementPresetContent(presetSupplementEntries(legacy, "X"), "nota");
    expect(JSON.stringify(saved)).not.toContain("clientId");
    expect(saved.notes).toBe("nota");
    expect(presetSupplementEntries(saved)[0].items).toHaveLength(2);
  });
});

describe("mapSupplementPresetEntries", () => {
  it("fills variables and creates fresh ids", () => {
    const [entry] = mapSupplementPresetEntries({ title: "Cabelos", content: legacy }, { paciente: "Ana" });
    expect(entry.notes).toBe("Para Ana");
    expect(entry.clientId).toBeTruthy();
  });
});

describe("counts and search", () => {
  it("counts combos and products", () => {
    expect(countPresetSupplements(legacy)).toEqual({ combos: 1, products: 2 });
  });

  it("searches inside the preset content", () => {
    expect(presetSearchText({ type: "supplement_pack", title: "Cabelos", content: legacy })).toContain("Dimpless");
    expect(presetSearchText({ type: "exam_order", title: "Check-up", content: { exams: [{ name: "Ferritina" }] } })).toContain(
      "Ferritina"
    );
  });
});
