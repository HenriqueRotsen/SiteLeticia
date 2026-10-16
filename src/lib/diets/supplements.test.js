import { describe, expect, it } from "vitest";
import {
  countSupplementProducts,
  flattenSupplementEntries,
  groupSupplementRows
} from "./supplements.js";

describe("supplement groups", () => {
  it("flattens groups and singles for persistence", () => {
    const rows = flattenSupplementEntries([
      {
        kind: "group",
        clientId: "g1",
        title: "Cabelos e Unhas",
        posology: "1 dose no café da manhã",
        items: [
          { clientId: "a", productName: "Nutricolin", dosage: "300 mg" },
          { clientId: "b", productName: "Biotina", dosage: "5 mg" }
        ]
      },
      {
        kind: "single",
        clientId: "s1",
        productName: "Vitamina D",
        dosage: "2000 UI",
        posology: "1x ao dia"
      }
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      productName: "Nutricolin",
      groupId: "g1",
      groupTitle: "Cabelos e Unhas",
      posology: "1 dose no café da manhã"
    });
    expect(rows[2]).toMatchObject({
      productName: "Vitamina D",
      groupId: null,
      posology: "1x ao dia"
    });
  });

  it("regroups flat rows into UI entries", () => {
    const entries = groupSupplementRows([
      {
        id: "1",
        product_name: "Nutricolin",
        dosage: "300 mg",
        posology: "1 dose no café da manhã",
        group_id: "g1",
        group_title: "Cabelos e Unhas",
        sort_order: 0
      },
      {
        id: "2",
        product_name: "Biotina",
        dosage: "5 mg",
        posology: "1 dose no café da manhã",
        group_id: "g1",
        group_title: "Cabelos e Unhas",
        sort_order: 1
      },
      {
        id: "3",
        product_name: "Vitamina D",
        dosage: "2000 UI",
        posology: "1x ao dia",
        sort_order: 2
      }
    ]);

    expect(entries).toHaveLength(2);
    expect(entries[0].kind).toBe("group");
    expect(entries[0].items).toHaveLength(2);
    expect(entries[1].kind).toBe("single");
    expect(countSupplementProducts(entries)).toBe(3);
  });
});
