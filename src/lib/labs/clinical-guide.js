/**
 * Guia clínico de exames laboratoriais (refs clássicas + ideais preventivos/funcionais).
 * Base: SBC, SBEM, SBH — apoio à decisão; não substitui julgamento clínico.
 */

export const CLINICAL_PRE_ANALYTICAL = [
  "Jejum clássico 8–12h; perfil lipídico: jejum de 12h não é obrigatório na maioria dos casos (SBC), exceto TG prévios > 440 mg/dL.",
  "Exercício intenso nas 24–48h pode alterar CPK, TGO (AST), ureia e creatinina.",
  "Desidratação leve pode hemoconcentrar (hematócrito, ureia)."
];

/**
 * ideal: faixa otimizada (preventiva/funcional).
 * lab: referência laboratorial clássica.
 * idealMaxExclusive / idealMinExclusive quando a meta é estritamente < ou >.
 */
export const CLINICAL_MARKERS = {
  glucose_fasting: {
    name: "Glicemia de Jejum",
    unit: "mg/dL",
    aliases: ["glicemia", "glicose", "glucose"],
    section: "glicemico",
    lab: { min: 70, max: 99 },
    ideal: { max: 90 },
    interpretation:
      "Avalia a glicose basal. Entre 100–125 mg/dL indica pré-diabetes. Isolada, não exclui resistência à insulina.",
    reassess: "3 a 6 meses (se alterada)"
  },
  insulin_fasting: {
    name: "Insulina Basal",
    unit: "µUI/mL",
    aliases: ["insulina", "insulina basal", "insulina jejum"],
    section: "glicemico",
    lab: { min: 2.6, max: 24.9 },
    ideal: { max: 8 },
    interpretation:
      "Melhor marcador precoce de resistência à insulina. Níveis altos indicam hiperinsulinemia compensatória.",
    reassess: "3 meses (pós-intervenção)"
  },
  homa_ir: {
    name: "HOMA-IR",
    unit: "",
    aliases: ["homa", "homa-ir", "homa ir"],
    section: "glicemico",
    lab: { max: 2.15 },
    ideal: { max: 1.5 },
    interpretation:
      "Cálculo (Glicemia × Insulina / 405). Padrão-ouro prático para confirmar resistência à insulina.",
    reassess: "3 meses"
  },
  hba1c: {
    name: "Hemoglobina Glicada (HbA1c)",
    unit: "%",
    aliases: ["hba1c", "hemoglobina glicada", "a1c"],
    section: "glicemico",
    lab: { max: 5.7 },
    ideal: { max: 5.2 },
    interpretation:
      "Reflete a média glicêmica dos últimos 90–120 dias. > 6,5% sugere diabetes (SBEM).",
    reassess: "3 a 4 meses"
  },
  total_cholesterol: {
    name: "Colesterol Total",
    unit: "mg/dL",
    aliases: ["colesterol total"],
    section: "lipidico",
    lab: { max: 190 },
    ideal: { max: 190 },
    interpretation:
      "Isoladamente tem pouco valor preditivo. Avaliar junto com as frações (SBC).",
    reassess: "6 a 12 meses"
  },
  triglycerides: {
    name: "Triglicerídeos",
    unit: "mg/dL",
    aliases: ["triglicer", "tg"],
    section: "lipidico",
    lab: { max: 150 },
    ideal: { max: 100 },
    interpretation:
      "Muito responsivo a dietas ricas em carboidratos, álcool e resistência à insulina.",
    reassess: "3 meses (se elevado)"
  },
  hdl: {
    name: "HDL-c",
    unit: "mg/dL",
    aliases: ["hdl"],
    section: "lipidico",
    lab: { min: 40 },
    ideal: { min: 50 },
    interpretation:
      "Fator de proteção. Aumenta com exercício físico e boas gorduras.",
    reassess: "6 a 12 meses"
  },
  ldl: {
    name: "LDL-c",
    unit: "mg/dL",
    aliases: ["ldl"],
    section: "lipidico",
    lab: { max: 130 },
    ideal: { max: 100 },
    interpretation:
      "Principal alvo terapêutico (SBC). Metas: risco alto < 70; muito alto < 50 mg/dL. Ajuste pela estratificação de risco.",
    reassess: "4 a 8 semanas (após iniciar estatina)"
  },
  apo_b: {
    name: "Apolipoproteína B (ApoB)",
    unit: "mg/dL",
    aliases: ["apob", "apo b", "apolipoproteina b"],
    section: "lipidico",
    lab: { max: 90 },
    ideal: { max: 90 },
    interpretation:
      "Reflete o número total de partículas aterogênicas. Superior ao LDL isolado.",
    reassess: "Anual (se disponível)"
  },
  tgp: {
    name: "TGP (ALT)",
    unit: "U/L",
    aliases: ["tgp", "alt", "tgp alt"],
    section: "hepatico",
    lab: { max: 41 },
    ideal: { max: 30 },
    interpretation:
      "Mais específica para o fígado. Elevações leves sugerem esteatose hepática não alcoólica.",
    reassess: "2 a 3 meses"
  },
  tgo: {
    name: "TGO (AST)",
    unit: "U/L",
    aliases: ["tgo", "ast"],
    section: "hepatico",
    lab: { max: 40 },
    ideal: { max: 30 },
    interpretation:
      "Presente no fígado, coração e músculos. TGO > TGP pode sugerir lesão muscular ou etilismo.",
    reassess: "2 a 3 meses"
  },
  ggt: {
    name: "Gama-GT (GGT)",
    unit: "U/L",
    aliases: ["gama gt", "ggt", "gama-gt", "gamagt"],
    section: "hepatico",
    lab: { max: 60 },
    ideal: { max: 25 },
    interpretation:
      "Altamente sensível ao álcool, estresse oxidativo, toxinas e resistência à insulina.",
    reassess: "2 a 3 meses"
  },
  creatinine: {
    name: "Creatinina",
    unit: "mg/dL",
    aliases: ["creatinina"],
    section: "renal",
    lab: { min: 0.7, max: 1.2 },
    ideal: { min: 0.7, max: 1.2 },
    interpretation:
      "Avalia a filtração renal. Pode ser levemente mais alta em pessoas musculosas ou em uso de creatina.",
    reassess: "6 a 12 meses"
  },
  egfr: {
    name: "Taxa de Filtração Glomerular (TFG)",
    unit: "mL/min",
    aliases: ["tfg", "egfr", "filtracao glomerular", "taxa de filtracao"],
    section: "renal",
    lab: { min: 60 },
    ideal: { min: 90 },
    interpretation: "Melhor marcador de função renal crônica.",
    reassess: "6 a 12 meses"
  },
  uric_acid: {
    name: "Ácido Úrico",
    unit: "mg/dL",
    aliases: ["acido urico", "uric"],
    section: "renal",
    lab: { max: 7 },
    ideal: { max: 5.5 },
    interpretation:
      "Risco de gota. Associado a síndrome metabólica, hipertensão e excesso de frutose/álcool.",
    reassess: "3 meses (se em tratamento)"
  },
  tsh: {
    name: "TSH",
    unit: "µUI/mL",
    aliases: ["tsh"],
    section: "tireoide",
    lab: { min: 0.4, max: 4.5 },
    ideal: { min: 1, max: 2.5 },
    interpretation:
      "Alto sugere hipotireoidismo; baixo, hipertireoidismo. Correlacionar com clínica (Choosing Wisely SBEM).",
    reassess: "6 a 8 semanas (após ajuste de levotiroxina)"
  },
  free_t4: {
    name: "T4 Livre",
    unit: "ng/dL",
    aliases: ["t4 livre", "t4l", "free t4"],
    section: "tireoide",
    lab: { min: 0.9, max: 1.7 },
    ideal: { min: 1.1, max: 1.4 },
    interpretation: "Hormônio circulante. Confirma disfunções apontadas pelo TSH.",
    reassess: "6 a 8 semanas"
  },
  anti_tpo: {
    name: "Anti-TPO",
    unit: "UI/mL",
    aliases: ["anti-tpo", "antitpo", "anti tpo"],
    section: "tireoide",
    lab: { max: 34 },
    ideal: { max: 34 },
    interpretation:
      "Marcador de Tireoidite de Hashimoto. Não deve ser repetido de rotina após diagnóstico positivo.",
    reassess: "Não repetir de rotina"
  },
  vitamin_b12: {
    name: "Vitamina B12",
    unit: "pg/mL",
    aliases: ["b12", "vitamina b12", "cobalamina"],
    section: "nutricional",
    lab: { min: 200, max: 900 },
    ideal: { min: 500, max: 800 },
    interpretation:
      "Fundamental para cognição e energia. Níveis < 400 já podem cursar com sintomas neurológicos subclínicos.",
    reassess: "3 a 6 meses (pós-reposição)"
  },
  vitamin_d: {
    name: "Vitamina D (25-OH)",
    unit: "ng/mL",
    aliases: ["vitamina d", "25-oh", "25oh", "25 oh"],
    section: "nutricional",
    lab: { min: 20 },
    ideal: { min: 40, max: 60 },
    interpretation: "Saúde óssea e imunidade. Reposição deve ser individualizada.",
    reassess: "3 meses (após início de ataque)"
  },
  ferritin: {
    name: "Ferritina",
    unit: "ng/mL",
    aliases: ["ferritina"],
    section: "nutricional",
    lab: { min: 30, max: 300 },
    ideal: { min: 70, max: 150 },
    interpretation:
      "Estoques de ferro. É proteína de fase aguda: pode estar alta por inflamação/esteatose. Avaliar com PCR.",
    reassess: "3 meses (avaliar junto com PCR)"
  },
  hs_crp: {
    name: "PCR Ultrasensível",
    unit: "mg/L",
    aliases: ["pcr", "pcr us", "proteina c reativa", "hs-crp", "hscrp"],
    section: "nutricional",
    lab: { max: 3 },
    ideal: { max: 1 },
    interpretation:
      "Marcador de inflamação sistêmica e risco cardiovascular de baixo grau.",
    reassess: "Conforme necessidade clínica"
  }
};

export const KNOWN_MARKER_KEYS = Object.keys(CLINICAL_MARKERS);

export const MARKER_PATTERNS = Object.entries(CLINICAL_MARKERS).map(([key, meta]) => ({
  key,
  regex: new RegExp(
    meta.aliases
      .map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .sort((a, b) => b.length - a.length)
      .join("|"),
    "i"
  )
}));

function inRange(value, { min = null, max = null } = {}) {
  if (value == null || Number.isNaN(value)) return null;
  if (min != null && value < min) return false;
  if (max != null && value > max) return false;
  return true;
}

/**
 * Avalia um resultado frente ao guia (lab + ideal).
 */
export function evaluateAgainstGuide(markerKey, value) {
  const guide = CLINICAL_MARKERS[markerKey];
  if (!guide) {
    return {
      guide: null,
      lab_flag: "unknown",
      ideal_flag: "unknown",
      within_lab: null,
      within_ideal: null
    };
  }

  const withinLab = inRange(value, guide.lab);
  const withinIdeal = inRange(value, guide.ideal);

  let lab_flag = "unknown";
  if (withinLab === true) lab_flag = "normal";
  else if (withinLab === false) {
    if (guide.lab.min != null && value < guide.lab.min) lab_flag = "low";
    else if (guide.lab.max != null && value > guide.lab.max) lab_flag = "high";
    else lab_flag = "high";
  }

  let ideal_flag = "unknown";
  if (withinIdeal === true) ideal_flag = "optimal";
  else if (withinIdeal === false) {
    if (withinLab === true) ideal_flag = "suboptimal";
    else ideal_flag = "out_of_range";
  }

  return {
    guide,
    lab_flag,
    ideal_flag,
    within_lab: withinLab,
    within_ideal: withinIdeal,
    reassess: guide.reassess,
    clinical_note: guide.interpretation
  };
}

/** Enriquece resultados com dados do guia (não sobrescreve refs do laudo se já existirem). */
export function enrichResultsWithClinicalGuide(results = []) {
  return (results || []).map((result) => {
    const key = result.marker_key;
    const value = result.value;
    const evaluation = evaluateAgainstGuide(key, value);
    const guide = evaluation.guide;

    if (!guide) {
      return {
        ...result,
        ideal_flag: result.ideal_flag || "unknown"
      };
    }

    const refMin = result.ref_min ?? guide.lab.min ?? null;
    const refMax = result.ref_max ?? guide.lab.max ?? null;
    const flag =
      result.flag && result.flag !== "unknown"
        ? result.flag
        : evaluation.lab_flag;

    return {
      ...result,
      marker_name: result.marker_name || guide.name,
      unit: result.unit || guide.unit || null,
      ref_min: refMin,
      ref_max: refMax,
      flag,
      ideal_min: guide.ideal.min ?? null,
      ideal_max: guide.ideal.max ?? null,
      ideal_flag: evaluation.ideal_flag,
      reassess_hint: guide.reassess,
      clinical_note: guide.interpretation
    };
  });
}

export function buildClinicalInterpretationSummary(results = []) {
  const enriched = enrichResultsWithClinicalGuide(results);
  if (!enriched.length) {
    return "Nenhum marcador do guia clínico foi identificado neste laudo.";
  }

  const lines = [];
  lines.push("Parecer orientativo (guia clínico SBC/SBEM + ideais preventivos):");
  lines.push("");

  for (const r of enriched) {
    const bits = [];
    const valueLabel =
      r.value != null ? `${r.value}${r.unit ? ` ${r.unit}` : ""}` : r.value_text || "—";
    bits.push(`${r.marker_name || r.marker_key}: ${valueLabel}`);

    if (r.flag === "high") bits.push("acima da referência laboratorial");
    else if (r.flag === "low") bits.push("abaixo da referência laboratorial");
    else if (r.flag === "normal") bits.push("dentro da referência laboratorial");

    if (r.ideal_flag === "optimal") bits.push("na faixa ideal/otimizada");
    else if (r.ideal_flag === "suboptimal") {
      bits.push("dentro do lab, porém fora do ideal preventivo");
    } else if (r.ideal_flag === "out_of_range") {
      bits.push("fora do ideal e da referência laboratorial");
    }

    if (r.clinical_note) bits.push(r.clinical_note);
    if (r.reassess_hint) bits.push(`Reavaliação sugerida: ${r.reassess_hint}.`);

    lines.push(`• ${bits.join(" — ")}`);
  }

  lines.push("");
  lines.push(
    "Prazos gerais: correção aguda 4–8 semanas; metabolismo/estilo de vida 3–4 meses; manutenção anual."
  );
  lines.push(
    "Este parecer é apoio clínico e deve ser revisado pela nutricionista antes da publicação."
  );

  return lines.join("\n");
}

/** Texto compacto para injetar nos prompts da IA. */
export function buildClinicalGuidePromptContext() {
  const rows = Object.entries(CLINICAL_MARKERS).map(([key, m]) => {
    const lab = [
      m.lab.min != null ? `≥${m.lab.min}` : null,
      m.lab.max != null ? `≤${m.lab.max}` : null
    ]
      .filter(Boolean)
      .join(" e ");
    const ideal = [
      m.ideal.min != null ? `≥${m.ideal.min}` : null,
      m.ideal.max != null ? `≤${m.ideal.max}` : null
    ]
      .filter(Boolean)
      .join(" e ");
    return `- ${key} (${m.name}, ${m.unit || "—"}): lab ${lab || "—"}; ideal ${ideal || "—"}. ${m.interpretation} Reavaliar: ${m.reassess}.`;
  });

  return [
    "Guia clínico interno (usar como base além dos valores impressos no laudo):",
    "Pré-analítico:",
    ...CLINICAL_PRE_ANALYTICAL.map((item) => `* ${item}`),
    "Marcadores (referência lab vs ideal preventivo):",
    ...rows,
    "Ao redigir o parecer: cite se o valor está no lab e/ou no ideal; sugira prazo de reavaliação quando pertinente; não diagnostique sozinho — linguagem de apoio à nutricionista."
  ].join("\n");
}

export function resolveMarkerKeyFromName(name) {
  const normalized = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  for (const [key, meta] of Object.entries(CLINICAL_MARKERS)) {
    if (meta.aliases.some((alias) => normalized.includes(alias))) return key;
  }
  return null;
}
