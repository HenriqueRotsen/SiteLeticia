/**
 * Ficha pré-consulta de nutrição integrativa — campos alinhados ao documento clínico.
 * Tipos: text | textarea | choice (única) | multichoice (várias).
 */

export const YES_NO = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" }
];

export const YES_NO_UNKNOWN = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "nao_sei", label: "Não sei / não lembro" }
];

export const NA = { value: "nao_se_aplica", label: "Não se aplica" };

export const YES_NO_NA = [...YES_NO, NA];
export const YES_NO_UNKNOWN_NA = [...YES_NO_UNKNOWN, NA];

export const FREQUENCY = [
  { value: "nunca", label: "Nunca / quase nunca" },
  { value: "raro", label: "Raro" },
  { value: "as_vezes", label: "Às vezes" },
  { value: "frequente", label: "Frequente" },
  { value: "diario", label: "Diário / quase diário" }
];

export const PRECONSULT_SECTIONS = [
  {
    id: "identification",
    title: "1. Identificação e Objetivos",
    description: "Quem você é e o que espera desta consulta.",
    fields: [
      {
        key: "fullName",
        label: "Nome completo",
        type: "text",
        required: true,
        fromProfile: true
      },
      {
        key: "age",
        label: "Idade",
        type: "text",
        required: false,
        cols: 1,
        fromProfile: true
      },
      { key: "profession", label: "Profissão", type: "text", required: true, cols: 3 },
      {
        key: "mainGoal",
        label: "Qual é o objetivo principal da consulta?",
        type: "textarea",
        required: true,
        fromProfile: true
      },
      {
        key: "specificDoubts",
        label: "Há alguma dúvida específica que você deseja esclarecer durante o tratamento?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: "history_childhood",
    title: "2. Histórico — Gestação e Infância",
    description: "Linha do tempo da saúde nos primeiros anos de vida.",
    fields: [
      {
        key: "birthType",
        label: "Você nasceu de parto normal ou cesárea?",
        type: "choice",
        required: true,
        options: [
          { value: "parto_normal", label: "Parto normal" },
          { value: "cesarea", label: "Cesárea" },
          { value: "nao_sei", label: "Não sei / não lembro" }
        ]
      },
      {
        key: "breastfedExclusive",
        label: "Você foi amamentado exclusivamente até os 6 meses de idade?",
        type: "choice",
        required: true,
        options: [
          { value: "sim", label: "Sim, exclusivamente" },
          { value: "parcial", label: "Parcialmente" },
          { value: "nao", label: "Não" },
          { value: "nao_sei", label: "Não sei / não lembro" }
        ]
      },
      {
        key: "childhoodIssues",
        label: "Apresentou algum destes na infância?",
        type: "multichoice",
        required: true,
        options: [
          { value: "colicas", label: "Cólicas" },
          { value: "diarreia", label: "Diarreia" },
          { value: "refluxo", label: "Refluxo" },
          { value: "alergias", label: "Alergias" },
          { value: "respiratorio", label: "Problemas respiratórios" },
          { value: "nenhum", label: "Nenhum / não lembro" }
        ]
      },
      {
        key: "earlyMedicationsSurgeries",
        label: "Nos dois primeiros anos de vida, você:",
        type: "multichoice",
        required: true,
        options: [
          { value: "medicamentos", label: "Usou medicamentos com frequência" },
          { value: "cirurgias", label: "Passou por cirurgia(s)" },
          { value: "nenhum", label: "Nenhum dos dois / não lembro" }
        ]
      }
    ]
  },
  {
    id: "history_current",
    title: "2. Histórico — Adolescência, Cirurgias e Família",
    description: "Traumas, cirurgias, imunidade e histórico familiar.",
    fields: [
      {
        key: "hormonalHistory",
        label: "Possui histórico de alterações hormonais?",
        type: "multichoice",
        required: true,
        options: [
          { value: "tireoide", label: "Tireoide" },
          { value: "insulina", label: "Insulina / resistência" },
          { value: "outros", label: "Outras alterações" },
          { value: "nao", label: "Não" }
        ]
      },
      {
        key: "menstrualHistory",
        label: "Como é o seu ciclo menstrual?",
        type: "choice",
        required: true,
        womenOnly: true,
        options: [
          { value: "regular", label: "Regular" },
          { value: "irregular", label: "Irregular" },
          { value: "ausente", label: "Ausente (amenorreia / menopausa / outro)" },
          NA
        ]
      },
      {
        key: "pregnancyHistory",
        label: "Já engravidou ou está grávida atualmente?",
        type: "choice",
        required: true,
        womenOnly: true,
        options: [
          { value: "nunca", label: "Nunca" },
          { value: "passado", label: "Já engravidou" },
          { value: "atual", label: "Estou grávida" },
          NA
        ]
      },
      {
        key: "stressorsTrauma",
        label: "Sofreu ou sofre com fatores estressores marcantes?",
        type: "multichoice",
        required: true,
        options: [
          { value: "trauma", label: "Trauma" },
          { value: "luto", label: "Luto" },
          { value: "mudancas", label: "Mudanças bruscas" },
          { value: "bullying", label: "Bullying" },
          { value: "outro", label: "Outro estressor" },
          { value: "nao", label: "Não" }
        ]
      },
      {
        key: "hadSurgeries",
        label: "Já realizou alguma cirurgia?",
        type: "choice",
        required: true,
        options: YES_NO_UNKNOWN
      },
      {
        key: "surgeries",
        label: "Se sim, relate as cirurgias (mesmo as mais simples)",
        type: "textarea",
        required: true,
        showWhen: { key: "hadSurgeries", values: ["sim"] }
      },
      {
        key: "physicalTrauma",
        label: "Já sofreu quedas no cóccix, traumas na cabeça/coluna ou acidentes graves?",
        type: "choice",
        required: true,
        options: YES_NO_UNKNOWN
      },
      {
        key: "recurrentInfections",
        label: "Possui histórico de infecções de repetição?",
        type: "multichoice",
        required: true,
        options: [
          { value: "candidiase", label: "Candidíase" },
          { value: "amigdalite", label: "Amigdalite" },
          { value: "herpes", label: "Herpes" },
          { value: "itu", label: "Infecção urinária" },
          { value: "micose", label: "Micose" },
          { value: "outra", label: "Outra" },
          { value: "nao", label: "Não" },
          NA
        ]
      },
      {
        key: "familyGiHistory",
        label: "Há histórico na família de:",
        type: "multichoice",
        required: true,
        options: [
          { value: "cancer_digestivo", label: "Câncer no sistema digestivo" },
          { value: "celiaca", label: "Doença celíaca" },
          { value: "dii", label: "Doença inflamatória intestinal" },
          { value: "nao", label: "Não / desconheço" }
        ]
      }
    ]
  },
  {
    id: "medications",
    title: "3. Histórico Medicamentoso e Suplementação",
    description: "Medicamentos, suplementos e usos frequentes ao longo da vida.",
    fields: [
      {
        key: "usesCurrentMedications",
        label: "Usa medicamentos, suplementos ou manipulados atualmente?",
        type: "choice",
        required: true,
        options: YES_NO
      },
      {
        key: "currentMedications",
        label: "Liste nome, dosagem e horários",
        type: "textarea",
        required: true,
        showWhen: { key: "usesCurrentMedications", values: ["sim"] }
      },
      {
        key: "antibioticsAntiInflammatories",
        label: "Uso de antibióticos, anti-inflamatórios ou corticoides:",
        type: "choice",
        required: true,
        options: [
          { value: "atual", label: "Uso atual" },
          { value: "frequente_passado", label: "Uso frequente no passado" },
          { value: "ocasional", label: "Uso ocasional" },
          { value: "nao", label: "Não" }
        ]
      },
      {
        key: "contraceptiveUse",
        label: "Uso de anticoncepcional hormonal (pílula, adesivo, anel, DIU hormonal):",
        type: "choice",
        required: true,
        womenOnly: true,
        options: [
          { value: "atual", label: "Uso atual" },
          { value: "passado_prolongado", label: "Já usei por tempo prolongado" },
          { value: "nao", label: "Nunca usei" },
          NA
        ]
      },
      {
        key: "protonPumpInhibitors",
        label: "Uso de omeprazol/pantoprazol ou antiácidos (ENO, bicarbonato):",
        type: "choice",
        required: true,
        options: [
          { value: "atual", label: "Uso atual" },
          { value: "passado", label: "Já usei" },
          { value: "nao", label: "Não" }
        ]
      }
    ]
  },
  {
    id: "digestive",
    title: "4. Saúde Digestiva, Intestinal e Protocolo 5R",
    description: "Sintomas digestivos, evacuação e sinais de alerta.",
    fields: [
      {
        key: "abdominalPain",
        label: "Dor abdominal recorrente (pelo menos 1 dia por semana)?",
        type: "choice",
        required: true,
        options: YES_NO
      },
      {
        key: "abdominalPainRelief",
        label: "Se sim, a dor alivia ao ir ao banheiro ou eliminar gases?",
        type: "choice",
        required: true,
        options: [
          { value: "sim", label: "Sim" },
          { value: "nao", label: "Não" },
          { value: "as_vezes", label: "Às vezes" }
        ],
        showWhen: { key: "abdominalPain", values: ["sim"] }
      },
      {
        key: "bloating",
        label: "Inchaço ou distensão abdominal após se alimentar?",
        type: "choice",
        required: true,
        options: FREQUENCY
      },
      {
        key: "redFlags",
        label: "Apresentou recentemente algum destes sinais?",
        type: "multichoice",
        required: true,
        options: [
          { value: "perda_peso", label: "Perda de peso não intencional" },
          { value: "sangramento", label: "Sangramento retal" },
          { value: "febre", label: "Febre" },
          { value: "noturno", label: "Sintomas noturnos" },
          { value: "articulacoes", label: "Dores nas articulações" },
          { value: "nao", label: "Nenhum" }
        ]
      },
      {
        key: "bowelFrequency",
        label: "Frequência de evacuação:",
        type: "choice",
        required: true,
        options: [
          { value: "mais_3_dia", label: "Mais de 3 vezes ao dia" },
          { value: "1_3_dia", label: "1 a 3 vezes ao dia" },
          { value: "dia_sim_nao", label: "Dia sim, dia não" },
          { value: "2_3_semana", label: "2 a 3 vezes por semana" },
          { value: "menos_2_semana", label: "Menos de 2 vezes por semana" }
        ]
      },
      {
        key: "incompleteEvacuation",
        label: "Sente que a defecação é incompleta?",
        type: "choice",
        required: true,
        options: YES_NO
      },
      {
        key: "bowelUrgency",
        label: "Sobre o controle intestinal, você:",
        type: "multichoice",
        required: true,
        options: [
          { value: "esforco", label: "Precisa fazer muita força" },
          { value: "urgencia", label: "Tem urgência para correr ao banheiro" },
          { value: "incontinencia", label: "Não consegue segurar as fezes" },
          { value: "nenhum", label: "Nenhum desses" }
        ]
      },
      {
        key: "stoolAppearance",
        label: "Como são suas fezes na maior parte do tempo?",
        type: "choice",
        required: true,
        options: [
          { value: "bolinhas", label: "Bolinhas / ressecadas" },
          { value: "firmes", label: "Firmes / cilindro" },
          { value: "pastosas", label: "Pastosas" },
          { value: "liquidas", label: "Líquidas / diarreia" },
          { value: "varia", label: "Varia bastante" }
        ]
      },
      {
        key: "stoolColor",
        label: "Cor predominante das fezes:",
        type: "choice",
        required: true,
        options: [
          { value: "marrom", label: "Marrom" },
          { value: "clara", label: "Clara / amarelada" },
          { value: "esverdeada", label: "Esverdeada" },
          { value: "escura", label: "Muito escura / preta" },
          { value: "outra", label: "Outra" }
        ]
      },
      {
        key: "stoolAbnormalities",
        label: "Nota nas fezes a presença de:",
        type: "multichoice",
        required: true,
        options: [
          { value: "muco", label: "Muco" },
          { value: "sangue", label: "Sangue" },
          { value: "gordura", label: "Gordura" },
          { value: "alimentos", label: "Alimentos mal digeridos" },
          { value: "nao", label: "Nada disso" }
        ]
      },
      {
        key: "foulSmell",
        label: "Fezes ou gases com cheiro muito ruim (ex.: enxofre/ovo podre)?",
        type: "choice",
        required: true,
        options: FREQUENCY
      },
      {
        key: "refluxBurps",
        label: "Sintomas digestivos altos:",
        type: "multichoice",
        required: true,
        options: [
          { value: "azia", label: "Azia / queimação" },
          { value: "arrotos", label: "Arrotos frequentes" },
          { value: "gosto_refeicao", label: "Gosto da comida horas depois" },
          { value: "nao", label: "Nenhum" }
        ]
      },
      {
        key: "garlicEggsMeatTrigger",
        label: "Piora dos sintomas ao consumir:",
        type: "multichoice",
        required: true,
        options: [
          { value: "alho", label: "Alho" },
          { value: "ovos", label: "Ovos" },
          { value: "carnes", label: "Carnes" },
          { value: "nao", label: "Não observo piora" }
        ]
      },
      {
        key: "nailsIronB12",
        label: "Unhas fracas/descamando ou deficiência de ferro/B12 em exames?",
        type: "multichoice",
        required: true,
        options: [
          { value: "unhas", label: "Unhas fracas / descamando" },
          { value: "ferro", label: "Deficiência de ferro" },
          { value: "b12", label: "Deficiência de B12" },
          { value: "nao", label: "Não" }
        ]
      }
    ]
  },
  {
    id: "oral",
    title: "5. Saúde Oral e Estrutural",
    description: "Boca, dentes, respiração e sono.",
    fields: [
      {
        key: "amalgamFillings",
        label: "Tem ou já teve restaurações de amálgama (metálicas)?",
        type: "choice",
        required: true,
        options: YES_NO_UNKNOWN
      },
      {
        key: "rootCanalExtractions",
        label: "Fez tratamento de canal ou extração de dentes (ex.: siso)?",
        type: "multichoice",
        required: true,
        options: [
          { value: "canal", label: "Tratamento de canal" },
          { value: "extracao", label: "Extração (ex.: siso)" },
          { value: "nao", label: "Não" }
        ]
      },
      {
        key: "bleedingGums",
        label: "Gengiva sangra com facilidade ao passar fio dental?",
        type: "choice",
        required: true,
        options: FREQUENCY
      },
      {
        key: "bruxismApneaMouthBreathing",
        label: "Você apresenta:",
        type: "multichoice",
        required: true,
        options: [
          { value: "bruxismo", label: "Ranger os dentes (bruxismo)" },
          { value: "apneia", label: "Apneia do sono" },
          { value: "boca", label: "Respiração pela boca" },
          { value: "nao", label: "Nenhum" }
        ]
      }
    ]
  },
  {
    id: "lifestyle",
    title: "6. Estilo de Vida e Hábitos",
    description: "Rotina de refeições, sono, estresse e hábitos.",
    fields: [
      {
        key: "mealEnvironment",
        label: "Ambiente na hora da refeição (marque o que mais se aplica):",
        type: "multichoice",
        required: true,
        options: [
          { value: "mesa", label: "Sentado à mesa, sem distrações" },
          { value: "pe", label: "De pé" },
          { value: "carro", label: "No carro" },
          { value: "sofa", label: "No sofá" },
          { value: "tela", label: "Com celular / TV / computador" }
        ]
      },
      {
        key: "chewingSpeed",
        label: "A sua mastigação é rápida?",
        type: "choice",
        required: true,
        options: [
          { value: "sim", label: "Sim, rápida" },
          { value: "media", label: "Moderada" },
          { value: "nao", label: "Não, costumo mastigar bem" }
        ]
      },
      {
        key: "sleepQuality",
        label: "Qualidade do sono:",
        type: "choice",
        required: true,
        options: [
          { value: "otima", label: "Ótima" },
          { value: "boa", label: "Boa" },
          { value: "regular", label: "Regular" },
          { value: "ruim", label: "Ruim" },
          { value: "pessima", label: "Péssima" }
        ]
      },
      {
        key: "stressLevel",
        label: "Nível de estresse diário:",
        type: "choice",
        required: true,
        options: [
          { value: "baixo", label: "Baixo" },
          { value: "moderado", label: "Moderado" },
          { value: "alto", label: "Alto" },
          { value: "muito_alto", label: "Muito alto" }
        ]
      },
      {
        key: "alcoholFreq",
        label: "Consumo de álcool:",
        type: "choice",
        required: true,
        options: FREQUENCY
      },
      {
        key: "caffeineFreq",
        label: "Consumo de cafeína:",
        type: "choice",
        required: true,
        options: FREQUENCY
      },
      {
        key: "sugarUltraFreq",
        label: "Consumo de açúcar e ultraprocessados:",
        type: "choice",
        required: true,
        options: FREQUENCY
      },
      {
        key: "waterIntake",
        label: "Ingestão de água e cor da urina:",
        type: "choice",
        required: true,
        options: [
          { value: "suficiente_clara", label: "Bebo o bastante e a urina é clara" },
          { value: "suficiente_amarela", label: "Bebo o bastante, mas a urina fica amarela" },
          { value: "pouca", label: "Bebo pouca água" },
          { value: "nao_sei", label: "Não sei avaliar" }
        ]
      }
    ]
  },
  {
    id: "food_recall",
    title: "7. Recordatório Alimentar de 24 Horas",
    description:
      "Descreva tudo o que comeu e bebeu no dia de ontem, com quantidades e modo de preparo.",
    fields: [
      { key: "wakeTime", label: "Horário que acordou", type: "text", cols: 1, required: true },
      { key: "sleepTime", label: "Horário que foi dormir", type: "text", cols: 1, required: true },
      {
        key: "waterLiters",
        label: "Consumo total de água (litros)",
        type: "text",
        cols: 1,
        required: true
      },
      {
        key: "breakfast",
        label: "Desjejum / Café da manhã (horário, local, alimentos e quantidades)",
        type: "textarea",
        required: true
      },
      {
        key: "morningSnack",
        label: "Lanche da manhã (horário, local, alimentos e quantidades) — se não fez, escreva “não fiz”",
        type: "textarea",
        required: true
      },
      {
        key: "lunch",
        label: "Almoço (horário, local, alimentos e quantidades)",
        type: "textarea",
        required: true
      },
      {
        key: "afternoonSnack",
        label: "Lanche da tarde (horário, local, alimentos e quantidades) — se não fez, escreva “não fiz”",
        type: "textarea",
        required: true
      },
      {
        key: "dinner",
        label: "Jantar (horário, local, alimentos e quantidades)",
        type: "textarea",
        required: true
      },
      {
        key: "eveningSnack",
        label: "Ceia / Antes de dormir — se não fez, escreva “não fiz”",
        type: "textarea",
        required: true
      },
      {
        key: "recallTypical",
        label: "O dia relatado representou sua rotina alimentar típica?",
        type: "choice",
        required: true,
        options: [
          { value: "tipico", label: "Sim, foi um dia típico" },
          { value: "excecao", label: "Não, houve alguma exceção" }
        ]
      },
      {
        key: "recallNotes",
        label: "Observações (exceção, desconfortos após alguma refeição etc.)",
        type: "textarea",
        required: true,
        showWhen: { key: "recallTypical", values: ["excecao"] }
      }
    ]
  }
];

export const PRECONSULT_FIELD_KEYS = PRECONSULT_SECTIONS.flatMap((section) =>
  section.fields.map((field) => field.key)
);

const FIELD_BY_KEY = Object.fromEntries(
  PRECONSULT_SECTIONS.flatMap((section) => section.fields.map((field) => [field.key, field]))
);

export function emptyPreconsultAnswers() {
  return Object.fromEntries(PRECONSULT_FIELD_KEYS.map((key) => [key, ""]));
}

export function parseMultiValues(raw) {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  const text = String(raw || "").trim();
  if (!text) return [];
  return text
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function serializeMultiValues(values) {
  return parseMultiValues(values).join("|");
}

export function normalizePreconsultAnswers(raw = {}) {
  const base = emptyPreconsultAnswers();
  for (const key of PRECONSULT_FIELD_KEYS) {
    if (raw[key] == null) continue;
    const field = FIELD_BY_KEY[key];
    if (field?.type === "multichoice") {
      base[key] = serializeMultiValues(raw[key]);
    } else {
      base[key] = String(raw[key]).slice(0, 4000);
    }
  }
  return base;
}

export function isFieldVisible(field, answers = {}) {
  if (!field.showWhen) return true;
  const current = String(answers[field.showWhen.key] || "");
  return (field.showWhen.values || []).includes(current);
}

export function formatAnswerLabel(field, rawValue) {
  if (rawValue == null || rawValue === "") return "";
  if (field.type === "multichoice") {
    const selected = parseMultiValues(rawValue);
    const labels = selected.map((value) => {
      const option = (field.options || []).find((item) => item.value === value);
      return option?.label || value;
    });
    return labels.join(", ");
  }
  if (field.type === "choice") {
    const option = (field.options || []).find((item) => item.value === rawValue);
    return option?.label || String(rawValue);
  }
  return String(rawValue);
}

export function getMissingRequiredInSection(section, answers = {}) {
  const normalized = normalizePreconsultAnswers(answers);
  const missing = [];

  for (const field of section.fields || []) {
    if (field.fromProfile) continue;
    if (!isFieldVisible(field, normalized)) continue;
    if (field.required === false) continue;
    // Campos sem `required` explícito não são exigidos; `required: true` ou ausente em
    // campos clínicos novos já vêm como true. Só exige quando required !== false e type
    // de pergunta (já marcamos required no schema).
    if (field.required && !String(normalized[field.key] || "").trim()) {
      missing.push(field.label);
    }
  }

  return missing;
}

export function validatePreconsultAnswers(answers) {
  const normalized = normalizePreconsultAnswers(answers);
  const missing = [];

  for (const section of PRECONSULT_SECTIONS) {
    missing.push(...getMissingRequiredInSection(section, normalized));
  }

  return { ok: missing.length === 0, missing, answers: normalized };
}

export function countFilledAnswers(answers = {}) {
  return PRECONSULT_FIELD_KEYS.filter((key) => String(answers[key] || "").trim()).length;
}

export const PROFILE_PREFILL_KEYS = PRECONSULT_SECTIONS.flatMap((section) =>
  section.fields.filter((field) => field.fromProfile).map((field) => field.key)
);

function ageFromBirthDate(birthDate) {
  if (!birthDate) return "";
  const date = new Date(`${String(birthDate).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age > 0 && age < 130 ? String(age) : "";
}

/** Monta valores já conhecidos do cadastro do paciente. */
export function buildPrefillFromPatient(patient = {}) {
  return {
    fullName: String(patient.full_name || patient.fullName || "").trim(),
    age: ageFromBirthDate(patient.birth_date || patient.birthDate),
    mainGoal: String(patient.goal || "").trim()
  };
}

/** Junta respostas salvas com pré-preenchimento do perfil (salva o que já existe). */
export function mergePrefillAnswers(savedAnswers = {}, patient = {}) {
  const base = normalizePreconsultAnswers(savedAnswers);
  const prefill = buildPrefillFromPatient(patient);
  for (const key of PROFILE_PREFILL_KEYS) {
    if (!String(base[key] || "").trim() && prefill[key]) {
      base[key] = prefill[key];
    }
  }

  const sex = String(patient.sex || "").toLowerCase();
  if (sex === "male") {
    for (const section of PRECONSULT_SECTIONS) {
      for (const field of section.fields) {
        if (!field.womenOnly) continue;
        if (String(base[field.key] || "").trim()) continue;
        base[field.key] = field.type === "multichoice" ? "nao_se_aplica" : "nao_se_aplica";
      }
    }
  }

  return base;
}
