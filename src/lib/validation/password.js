export const PASSWORD_RULES = [
  {
    id: "length",
    label: "Mínimo de 8 caracteres",
    test: (value) => String(value || "").length >= 8
  },
  {
    id: "lower",
    label: "Uma letra minúscula",
    test: (value) => /[a-z]/.test(String(value || ""))
  },
  {
    id: "upper",
    label: "Uma letra maiúscula",
    test: (value) => /[A-Z]/.test(String(value || ""))
  },
  {
    id: "number",
    label: "Um número",
    test: (value) => /\d/.test(String(value || ""))
  },
  {
    id: "special",
    label: "Um caractere especial",
    test: (value) => /[^A-Za-z0-9]/.test(String(value || ""))
  }
];

export function isStrongPassword(value) {
  return PASSWORD_RULES.every((rule) => rule.test(value));
}

export function getPasswordFailures(value) {
  return PASSWORD_RULES.filter((rule) => !rule.test(value)).map((rule) => rule.label);
}
