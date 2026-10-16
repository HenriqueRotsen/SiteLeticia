/**
 * Variáveis de template nos presets: {{chave}}
 * Também reconhece placeholders legados [CHAVE] / [chave].
 */

export const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
export const LEGACY_BRACKET_PATTERN = /\[([^\]]{1,80})\]/g;

/** Catálogo do sistema (botão {{}} + formulário na prescrição). */
export const PRESET_VARIABLES = [
  { key: "paciente", label: "Nome do paciente", group: "paciente", auto: "patientName" },
  {
    key: "data_nascimento",
    label: "Data de nascimento",
    group: "paciente",
    auto: "birthDate"
  },
  { key: "sexo", label: "Sexo", group: "paciente", auto: "sex" },
  {
    key: "data_solicitacao",
    label: "Data da solicitação",
    group: "paciente",
    auto: "today"
  },
  {
    key: "nutricionista",
    label: "Nome do nutricionista",
    group: "profissional",
    defaultValue: "Letícia Cunha"
  },
  { key: "crn", label: "CRN", group: "profissional" },
  { key: "endereco", label: "Endereço do consultório", group: "profissional" },
  { key: "telefone", label: "Telefone", group: "profissional" },
  { key: "email", label: "E-mail", group: "profissional" },
  { key: "data", label: "Data do exame / referência", group: "clinico" },
  { key: "valor", label: "Valor laboratorial", group: "clinico" },
  { key: "queixa_principal", label: "Queixa principal", group: "clinico" },
  { key: "tempo_tratamento", label: "Tempo de tratamento", group: "clinico" },
  {
    key: "tempo_acompanhamento",
    label: "Tempo de acompanhamento",
    group: "clinico"
  },
  { key: "achados_exames", label: "Achados laboratoriais", group: "clinico" },
  { key: "observacao_clinica", label: "Observação clínica", group: "clinico" }
];

/** Variáveis sempre pedidas ao aplicar pedido de exames (cabeçalho do PDF original). */
export const EXAM_HEADER_VARIABLE_KEYS = [
  "paciente",
  "data_nascimento",
  "sexo",
  "data_solicitacao",
  "nutricionista",
  "crn",
  "endereco",
  "telefone",
  "email"
];

const LEGACY_KEY_MAP = {
  paciente: "paciente",
  "nome do paciente": "paciente",
  "nome do nutricionista": "nutricionista",
  numero: "crn",
  número: "crn",
  "endereço completo": "endereco",
  "endereco completo": "endereco",
  telefone: "telefone",
  "e-mail": "email",
  email: "email",
  data: "data",
  valor: "valor",
  tempo: "tempo_tratamento",
  "tempo de tratamento": "tempo_tratamento",
  "tempo de acompanhamento": "tempo_acompanhamento"
};

const VARIABLE_BY_KEY = Object.fromEntries(PRESET_VARIABLES.map((item) => [item.key, item]));

export function normalizeVariableKey(raw) {
  const text = String(raw || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  if (!text) return "";
  if (LEGACY_KEY_MAP[text]) return LEGACY_KEY_MAP[text];
  return text
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function formatVariableToken(key) {
  return `{{${normalizeVariableKey(key)}}}`;
}

export function getVariableMeta(key) {
  const normalized = normalizeVariableKey(key);
  return (
    VARIABLE_BY_KEY[normalized] || {
      key: normalized,
      label: normalized.replace(/_/g, " "),
      group: "custom"
    }
  );
}

function walkStrings(value, visit) {
  if (typeof value === "string") {
    visit(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => walkStrings(item, visit));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => walkStrings(item, visit));
  }
}

function mapStrings(value, mapFn) {
  if (typeof value === "string") return mapFn(value);
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, mapFn));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, mapStrings(item, mapFn)])
    );
  }
  return value;
}

/** Converte [legado] → {{chave}} quando reconhecível; deixa o restante intacto. */
export function normalizeLegacyPlaceholders(text) {
  return String(text || "").replace(LEGACY_BRACKET_PATTERN, (full, inner) => {
    const key = normalizeVariableKey(inner);
    if (!key) return full;
    // Ignora trechos longos/descritivos que não são variáveis
    if (inner.length > 40 || /[:/]/.test(inner) || /\s{2,}/.test(inner)) {
      if (!LEGACY_KEY_MAP[inner.trim().toLowerCase()] && !VARIABLE_BY_KEY[key]) {
        return full;
      }
    }
    if (LEGACY_KEY_MAP[inner.trim().toLowerCase()] || VARIABLE_BY_KEY[key] || key.length <= 24) {
      return formatVariableToken(key);
    }
    return full;
  });
}

export function extractVariableKeys(source, { includeLegacy = true } = {}) {
  const keys = new Set();
  walkStrings(source, (text) => {
    const normalized = includeLegacy ? normalizeLegacyPlaceholders(text) : text;
    for (const match of normalized.matchAll(VARIABLE_PATTERN)) {
      const key = normalizeVariableKey(match[1]);
      if (key) keys.add(key);
    }
  });
  return [...keys];
}

export function fillVariables(source, values = {}) {
  const map = Object.fromEntries(
    Object.entries(values || {}).map(([key, value]) => [normalizeVariableKey(key), value ?? ""])
  );

  return mapStrings(source, (text) => {
    const normalized = normalizeLegacyPlaceholders(text);
    return normalized.replace(VARIABLE_PATTERN, (full, rawKey) => {
      const key = normalizeVariableKey(rawKey);
      if (!key) return full;
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        return String(map[key] ?? "");
      }
      return full;
    });
  });
}

export function buildDefaultVariableValues(keys = [], context = {}) {
  const values = {};
  const today = new Date().toLocaleDateString("pt-BR");

  for (const key of keys) {
    const meta = getVariableMeta(key);
    if (meta.auto === "patientName") values[key] = context.patientName || "";
    else if (meta.auto === "birthDate") {
      values[key] = formatDateBr(context.birthDate) || context.birthDate || "";
    } else if (meta.auto === "sex") values[key] = labelSex(context.sex) || context.sex || "";
    else if (meta.auto === "today") values[key] = today;
    else if (meta.defaultValue) values[key] = meta.defaultValue;
    else values[key] = context[key] || "";
  }
  return values;
}

function formatDateBr(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("pt-BR");
}

function labelSex(value) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "f" || normalized === "female" || normalized === "feminino") return "F";
  if (normalized === "m" || normalized === "male" || normalized === "masculino") return "M";
  return value || "";
}

export function groupVariablesForForm(keys = []) {
  const groups = {
    paciente: [],
    profissional: [],
    clinico: [],
    custom: []
  };
  for (const key of keys) {
    const meta = getVariableMeta(key);
    const bucket = groups[meta.group] ? meta.group : "custom";
    groups[bucket].push(meta);
  }
  return groups;
}
