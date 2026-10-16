import {
  fillVariables,
  normalizeLegacyPlaceholders
} from "@/lib/presets/variables";

/**
 * Normaliza texto vindo dos presets (PDF) para o visual/conteúdo do sistema.
 */
export function cleanPresetText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function fillPatientPlaceholders(text, patientName = "") {
  return fillVariables(normalizeLegacyPlaceholders(text), {
    paciente: patientName?.trim() || "paciente"
  });
}

export function mapSupplementPresetItems(content = {}, variableValues = {}) {
  const filled = fillVariables(content, variableValues);
  return (filled.items || []).map((item) => ({
    kind: "single",
    clientId: crypto.randomUUID(),
    productName: cleanPresetText(item.productName),
    dosage: cleanPresetText(item.dosage),
    posology: cleanPresetText(item.posology),
    notes: cleanPresetText(item.notes || filled.notes || "")
  }));
}

/**
 * Aplica um preset de suplementação como um combo/grupo (pedido único).
 */
export function mapSupplementPresetGroup(preset, variableValues = {}) {
  const filled = fillVariables(preset.content || {}, variableValues);
  const rawItems = filled.items || [];
  const sharedPosology =
    filled.packPosology ||
    rawItems.find((item) => String(item.posology || "").trim())?.posology ||
    "";

  return {
    kind: "group",
    clientId: crypto.randomUUID(),
    title: cleanPresetText(preset.title || "Combo"),
    posology: cleanPresetText(sharedPosology),
    notes: cleanPresetText(filled.notes || ""),
    items: rawItems.map((item) => ({
      clientId: crypto.randomUUID(),
      productName: cleanPresetText(item.productName),
      dosage: cleanPresetText(item.dosage),
      notes: cleanPresetText(item.notes || "")
    }))
  };
}

/**
 * @param {object} preset
 * @param {object} options
 * @param {string} [options.patientName]
 * @param {Record<string,string>} [options.variableValues]
 * @param {string[]|null} [options.includeComplementaryNames] — null = todos; [] = nenhum
 */
export function mapExamPresetOrder(preset, options = {}) {
  const patientName = typeof options === "string" ? options : options.patientName || "";
  const variableValues =
    typeof options === "string"
      ? { paciente: patientName }
      : { paciente: patientName, ...(options.variableValues || {}) };
  const includeComplementaryNames =
    typeof options === "string" ? null : options.includeComplementaryNames;

  const content = fillVariables(preset.content || {}, variableValues);
  const exams = (content.exams || [])
    .filter((exam) => {
      if (exam.category !== "complementary") return true;
      if (includeComplementaryNames == null) return true;
      return includeComplementaryNames.includes(exam.name);
    })
    .map((exam) => ({
      clientId: crypto.randomUUID(),
      name: cleanPresetText(exam.name),
      category: exam.category === "complementary" ? "complementary" : "principal",
      whenToRequest: cleanPresetText(exam.whenToRequest || "")
    }));

  return {
    clientId: crypto.randomUUID(),
    title: cleanPresetText(
      fillVariables(preset.title || "Pedido de exames", variableValues)
    ),
    exams,
    collectionNotes: (content.collectionNotes || []).map(cleanPresetText).filter(Boolean),
    observations: cleanPresetText(content.observations || ""),
    meta: {
      paciente: variableValues.paciente || patientName || "",
      data_nascimento: variableValues.data_nascimento || "",
      sexo: variableValues.sexo || "",
      data_solicitacao: variableValues.data_solicitacao || "",
      nutricionista: variableValues.nutricionista || "",
      crn: variableValues.crn || "",
      endereco: variableValues.endereco || "",
      telefone: variableValues.telefone || "",
      email: variableValues.email || ""
    }
  };
}

export function mapReferralPresetItem(preset, options = {}) {
  const patientName = typeof options === "string" ? options : options.patientName || "";
  const variableValues =
    typeof options === "string"
      ? { paciente: patientName }
      : { paciente: patientName, ...(options.variableValues || {}) };

  const content = fillVariables(preset.content || {}, variableValues);
  return {
    clientId: crypto.randomUUID(),
    specialty: cleanPresetText(content.specialty || preset.title || ""),
    professionalName: "",
    reason: cleanPresetText(content.reason || "Solicitação de parecer médico"),
    urgency: content.urgency === "priority" ? "priority" : "routine",
    bodyText: cleanPresetText(content.bodyText || ""),
    notes: cleanPresetText(content.notes || "")
  };
}
