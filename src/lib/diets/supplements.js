/**
 * Suplementos na prescrição: avulsos (single) ou combos/grupos (group).
 */

export function emptySingleSupplement() {
  return {
    kind: "single",
    clientId: crypto.randomUUID(),
    productName: "",
    dosage: "",
    posology: "",
    notes: ""
  };
}

export function emptySupplementGroup(title = "Novo combo") {
  return {
    kind: "group",
    clientId: crypto.randomUUID(),
    title,
    posology: "",
    notes: "",
    items: [
      {
        clientId: crypto.randomUUID(),
        productName: "",
        dosage: "",
        notes: ""
      }
    ]
  };
}

export function emptyGroupItem() {
  return {
    clientId: crypto.randomUUID(),
    productName: "",
    dosage: "",
    notes: ""
  };
}

/** Conta produtos (itens dentro de grupos + avulsos). */
export function countSupplementProducts(entries = []) {
  return entries.reduce((sum, entry) => {
    if (entry?.kind === "group") return sum + (entry.items || []).length;
    return sum + 1;
  }, 0);
}

/**
 * Converte linhas do banco (planas) em entradas de UI (single/group).
 */
export function groupSupplementRows(rows = []) {
  const sorted = [...rows].sort(
    (a, b) => (a.sort_order ?? a.sortOrder ?? 0) - (b.sort_order ?? b.sortOrder ?? 0)
  );

  const result = [];
  const groups = new Map();

  for (const item of sorted) {
    const groupId = item.group_id || item.groupId || null;
    const productName = item.product_name || item.productName || "";
    const dosage = item.dosage || "";
    const posology = item.posology || "";
    const notes = item.notes || "";

    if (!groupId) {
      result.push({
        kind: "single",
        clientId: item.id || crypto.randomUUID(),
        productName,
        dosage,
        posology,
        notes,
        sortOrder: item.sort_order ?? item.sortOrder ?? result.length
      });
      continue;
    }

    let group = groups.get(groupId);
    if (!group) {
      group = {
        kind: "group",
        clientId: groupId,
        title: item.group_title || item.groupTitle || "Combo",
        posology,
        notes: "",
        items: [],
        sortOrder: item.sort_order ?? item.sortOrder ?? result.length
      };
      groups.set(groupId, group);
      result.push(group);
    }

    group.items.push({
      clientId: item.id || crypto.randomUUID(),
      productName,
      dosage,
      notes
    });
    if (posology) group.posology = posology;
  }

  return result;
}

/**
 * Achata entradas da UI em linhas para API/banco.
 */
export function flattenSupplementEntries(entries = []) {
  const rows = [];
  let sortOrder = 0;

  for (const entry of entries) {
    if (entry?.kind === "group") {
      const groupId = entry.clientId || crypto.randomUUID();
      const groupTitle = String(entry.title || "Combo").trim() || "Combo";
      const groupPosology =
        String(entry.posology || "").trim() || "Conforme orientação";

      for (const item of entry.items || []) {
        const productName = String(item.productName || "").trim();
        if (!productName) continue;
        rows.push({
          productName,
          dosage: String(item.dosage || "").trim() || "—",
          posology: groupPosology,
          notes: String(item.notes || "").trim() || null,
          groupId,
          groupTitle,
          sortOrder: sortOrder++
        });
      }
      continue;
    }

    const productName = String(entry?.productName || "").trim();
    if (!productName) continue;
    rows.push({
      productName,
      dosage: String(entry.dosage || "").trim() || "—",
      posology: String(entry.posology || "").trim() || "Conforme orientação",
      notes: String(entry.notes || "").trim() || null,
      groupId: null,
      groupTitle: null,
      sortOrder: sortOrder++
    });
  }

  return rows;
}
