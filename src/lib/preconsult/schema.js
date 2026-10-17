/**
 * Ficha pré-consulta de nutrição integrativa — campos alinhados ao documento clínico.
 */

export const PRECONSULT_SECTIONS = [
  {
    id: "identification",
    title: "1. Identificação e Objetivos",
    description: "Quem você é e o que espera desta consulta.",
    fields: [
      { key: "fullName", label: "Nome completo", type: "text", required: true },
      { key: "age", label: "Idade", type: "text", required: true, cols: 1 },
      { key: "profession", label: "Profissão", type: "text", required: false, cols: 2 },
      {
        key: "mainGoal",
        label: "Qual é o objetivo principal da consulta?",
        type: "textarea",
        required: true
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
        type: "textarea",
        required: false
      },
      {
        key: "breastfedExclusive",
        label: "Você foi amamentado exclusivamente até os 6 meses de idade?",
        type: "textarea",
        required: false
      },
      {
        key: "childhoodIssues",
        label:
          "Apresentou cólicas, diarreia, refluxo, alergias ou problemas respiratórios na infância?",
        type: "textarea",
        required: false
      },
      {
        key: "earlyMedicationsSurgeries",
        label:
          "Fez uso de medicamentos ou passou por cirurgias nos dois primeiros anos de vida?",
        type: "textarea",
        required: false
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
        label:
          "Possui histórico de alterações hormonais (ex.: tireoide, insulina, menstruação irregular)?",
        type: "textarea",
        required: false
      },
      {
        key: "stressorsTrauma",
        label:
          "Você sofreu ou sofre com fatores estressores marcantes, como traumas, luto, mudanças bruscas ou bullying?",
        type: "textarea",
        required: false
      },
      {
        key: "surgeries",
        label:
          "Relate todas as cirurgias que já realizou (mesmo as mais simples, como amígdalas, apêndice, vesícula ou parto cesárea)",
        type: "textarea",
        required: false
      },
      {
        key: "physicalTrauma",
        label:
          "Você já sofreu quedas sobre o cóccix, traumas na cabeça/coluna ou acidentes graves?",
        type: "textarea",
        required: false
      },
      {
        key: "recurrentInfections",
        label:
          "Possui histórico de infecções de repetição (ex.: candidíase, amigdalite, herpes, infecção urinária, micose)?",
        type: "textarea",
        required: false
      },
      {
        key: "familyGiHistory",
        label:
          "Há histórico na família de câncer no sistema digestivo, doença celíaca ou doença inflamatória intestinal?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: "medications",
    title: "3. Histórico Medicamentoso e Suplementação",
    description: "Medicamentos, suplementos e usos frequentes ao longo da vida.",
    fields: [
      {
        key: "currentMedications",
        label:
          "Liste o nome, a dosagem e os horários de todos os medicamentos, suplementos ou manipulados que você usa atualmente",
        type: "textarea",
        required: false
      },
      {
        key: "antibioticsAntiInflammatories",
        label:
          "Faz uso atual ou fez uso frequente ao longo da vida de antibióticos, anti-inflamatórios ou corticoides?",
        type: "textarea",
        required: false
      },
      {
        key: "contraceptiveUse",
        label:
          "Você usa ou já fez uso prolongado de pílula anticoncepcional (ou adesivo, anel, DIU com hormônio)?",
        type: "textarea",
        required: false
      },
      {
        key: "protonPumpInhibitors",
        label:
          "Faz uso de inibidores da bomba de prótons (omeprazol, pantoprazol) ou antiácidos (ENO, bicarbonato)?",
        type: "textarea",
        required: false
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
        label:
          "Você sente dor abdominal recorrente (pelo menos 1 dia por semana)? Essa dor alivia ao ir ao banheiro ou eliminar gases?",
        type: "textarea",
        required: false
      },
      {
        key: "bloating",
        label: "Apresenta inchaço ou distensão abdominal após se alimentar?",
        type: "textarea",
        required: false
      },
      {
        key: "redFlags",
        label:
          "Apresentou recentemente: perda de peso não intencional, sangramento retal, febre, sintomas noturnos ou dores nas articulações?",
        type: "textarea",
        required: false
      },
      {
        key: "bowelFrequency",
        label: "Qual é a sua frequência de evacuação? Sente que a defecação é incompleta?",
        type: "textarea",
        required: false
      },
      {
        key: "bowelUrgency",
        label:
          "Você precisa fazer muita força, tem urgência para correr ao banheiro ou não consegue segurar as fezes?",
        type: "textarea",
        required: false
      },
      {
        key: "stoolAppearance",
        label:
          "Como são suas fezes? (Descreva se são bolinhas, ressecadas, pastosas ou líquidas). Qual a cor predominante?",
        type: "textarea",
        required: false
      },
      {
        key: "stoolAbnormalities",
        label:
          "Você nota a presença de muco, sangue, gordura ou pedaços de alimentos mal digeridos nas fezes?",
        type: "textarea",
        required: false
      },
      {
        key: "foulSmell",
        label: "Suas fezes ou gases possuem cheiro muito ruim (ex.: enxofre/ovo podre)?",
        type: "textarea",
        required: false
      },
      {
        key: "refluxBurps",
        label:
          "Costuma ter azia, queimação, arrotos frequentes ou sente o gosto da comida horas após a refeição?",
        type: "textarea",
        required: false
      },
      {
        key: "garlicEggsMeatTrigger",
        label: "Observa piora dos sintomas digestivos ao consumir alho, ovos ou carnes?",
        type: "textarea",
        required: false
      },
      {
        key: "nailsIronB12",
        label:
          "Apresenta unhas fracas/descamando ou tem exames com deficiência de ferro e vitamina B12?",
        type: "textarea",
        required: false
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
        type: "textarea",
        required: false
      },
      {
        key: "rootCanalExtractions",
        label: "Fez tratamento de canal ou extração de dentes (ex.: siso)?",
        type: "textarea",
        required: false
      },
      {
        key: "bleedingGums",
        label: "Sua gengiva sangra com facilidade ao passar fio dental?",
        type: "textarea",
        required: false
      },
      {
        key: "bruxismApneaMouthBreathing",
        label:
          "Você range os dentes durante o sono, tem apneia ou respira frequentemente pela boca?",
        type: "textarea",
        required: false
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
        label:
          "Como é o seu ambiente na hora da refeição? Come de pé, no carro, no sofá, ou mexendo no celular/TV?",
        type: "textarea",
        required: false
      },
      {
        key: "chewingSpeed",
        label: "A sua mastigação é rápida?",
        type: "textarea",
        required: false
      },
      {
        key: "sleepStress",
        label: "Como você avalia a qualidade do seu sono e o seu nível de estresse diário?",
        type: "textarea",
        required: false
      },
      {
        key: "alcoholCaffeineSugar",
        label: "Qual é a frequência do seu consumo de álcool, cafeína, açúcar e ultraprocessados?",
        type: "textarea",
        required: false
      },
      {
        key: "waterIntake",
        label: "Sua ingestão de água diária é suficiente? A cor da sua urina é clara?",
        type: "textarea",
        required: false
      }
    ]
  },
  {
    id: "food_recall",
    title: "7. Recordatório Alimentar de 24 Horas",
    description:
      "Descreva tudo o que comeu e bebeu no dia de ontem, com quantidades e modo de preparo.",
    fields: [
      { key: "wakeTime", label: "Horário que acordou", type: "text", cols: 1 },
      { key: "sleepTime", label: "Horário que foi dormir", type: "text", cols: 1 },
      { key: "waterLiters", label: "Consumo total de água (litros)", type: "text", cols: 1 },
      {
        key: "breakfast",
        label: "Desjejum / Café da manhã (horário, local, alimentos e quantidades)",
        type: "textarea"
      },
      {
        key: "morningSnack",
        label: "Lanche da manhã (horário, local, alimentos e quantidades)",
        type: "textarea"
      },
      {
        key: "lunch",
        label: "Almoço (horário, local, alimentos e quantidades)",
        type: "textarea"
      },
      {
        key: "afternoonSnack",
        label: "Lanche da tarde (horário, local, alimentos e quantidades)",
        type: "textarea"
      },
      {
        key: "dinner",
        label: "Jantar (horário, local, alimentos e quantidades)",
        type: "textarea"
      },
      {
        key: "eveningSnack",
        label: "Ceia / Antes de dormir (horário, local, alimentos e quantidades)",
        type: "textarea"
      },
      {
        key: "recallNotes",
        label:
          "O dia relatado representou sua rotina típica ou houve alguma exceção? Sentiu desconfortos após alguma refeição?",
        type: "textarea"
      }
    ]
  }
];

export const PRECONSULT_FIELD_KEYS = PRECONSULT_SECTIONS.flatMap((section) =>
  section.fields.map((field) => field.key)
);

export function emptyPreconsultAnswers() {
  return Object.fromEntries(PRECONSULT_FIELD_KEYS.map((key) => [key, ""]));
}

export function normalizePreconsultAnswers(raw = {}) {
  const base = emptyPreconsultAnswers();
  for (const key of PRECONSULT_FIELD_KEYS) {
    if (raw[key] != null) base[key] = String(raw[key]).slice(0, 4000);
  }
  return base;
}

export function validatePreconsultAnswers(answers) {
  const normalized = normalizePreconsultAnswers(answers);
  const missing = [];

  for (const section of PRECONSULT_SECTIONS) {
    for (const field of section.fields) {
      if (field.required && !String(normalized[field.key] || "").trim()) {
        missing.push(field.label);
      }
    }
  }

  return { ok: missing.length === 0, missing, answers: normalized };
}

export function countFilledAnswers(answers = {}) {
  return PRECONSULT_FIELD_KEYS.filter((key) => String(answers[key] || "").trim()).length;
}
