const EXCLUDED_CLASSES = new Set([
  "Alimentos para fins especiais",
  "Fast food",
  "Bebidas",
  "Miscelâneas",
  "Alimentos industrializados"
]);

const EXCLUDED_KEYWORDS = [
  "sopa",
  "papa de",
  "papa ",
  "molho de",
  "molho,",
  "salada de",
  "salada,",
  "sanduíche",
  "sanduiche",
  "lasanha",
  "estrogonofe",
  "risoto",
  "pizza",
  "refeição",
  "prato feito",
  "vitamina de",
  "vitamina,",
  "suco natural",
  "suco,",
  "smoothie",
  "coquetel de",
  "mistura p/",
  "preparado (",
  "caseira,",
  "cocada",
  "empada",
  "hambúrguer",
  "hamburguer",
  "salsicha",
  "linguiça",
  "linguica",
  "gelatina",
  "bombom",
  "pepperoni",
  "patê",
  "pate,",
  "croquete",
  "nugget",
  "empanad",
  "torrada,",
  "chantily",
  "reconstitu",
  "industrializ",
  "instantâneo",
  "instantaneo"
];

const BRAND_MARKERS = [
  "seara",
  "sadia",
  "perdig",
  "friboi",
  "nestl",
  "oetker",
  "marilan",
  "tostines",
  "bauducco",
  "gran´dia",
  "lollo",
  "maggi",
  "nan comfort"
];

export function normalizeFoodLabel(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeTbcaDisplayName(descricao) {
  if (!descricao) return "";

  let name = descricao.trim();
  name = name.replace(
    /,\s*(?:[A-Z][a-z]+(?:\s+[a-z.()-]+)*\s*)?(?:spp\.|L\.|Walp\.|Sweet,|Jacq\.|Bos taurus,).*$/i,
    ""
  );
  name = name.replace(/,\s*s\/\s*[^,]+/gi, "");
  name = name.replace(/,\s*c\/\s*[^,]+/gi, "");
  name = name.replace(/,\s*[A-Z][A-Za-z0-9´'`]+$/u, "");

  return name.replace(/,\s*$/, "").replace(/\s+/g, " ").trim();
}

export function isTbcaIngredient({ descricao, classe, name, food_group } = {}) {
  const text = (descricao || name || "").trim();
  const group = classe || food_group || "";
  const lower = text.toLowerCase();

  if (!text) return false;
  if (EXCLUDED_CLASSES.has(group)) return false;
  if (/\bc\/\s/.test(lower) || /\bc\s+\//.test(lower)) return false;
  if (/\([^)]{20,}\)/.test(text)) return false;
  if (EXCLUDED_KEYWORDS.some((keyword) => lower.includes(keyword))) return false;
  if (BRAND_MARKERS.some((brand) => lower.includes(brand))) return false;

  return true;
}

export function isTbcaComplementFood(record, tacoLabels = new Set()) {
  if (!isTbcaIngredient(record)) return false;

  const displayName = normalizeTbcaDisplayName(record.descricao || record.name);
  if (!displayName) return false;
  if (displayName.length > 45) return false;
  if ((displayName.match(/,/g) || []).length > 3) return false;

  const normalized = normalizeFoodLabel(displayName);

  for (const tacoLabel of tacoLabels) {
    if (tacoLabel === normalized || tacoLabel.includes(normalized) || normalized.includes(tacoLabel)) {
      return false;
    }
  }

  return true;
}
