import { generateSlotsFromRules } from "@/lib/scheduling/slots";

const patientId = "demo-patient-001";

function futureDate(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function pastDate(days, hour, minute = 0) {
  return futureDate(-Math.abs(days), hour, minute);
}

function slotStarts(days, hour) {
  return futureDate(days, hour);
}

export const demoPatient = {
  id: patientId,
  full_name: "Maria Demo Silva",
  phone: "31999998888",
  goal: "Emagrecimento",
  cpf_masked: "***.456.789-**",
  sex: "female",
  birth_date: "1990-03-15",
  height_cm: 165,
  body_fat_percent: null,
  activity_level: "sedentary",
  latest_weight_kg: 68,
  latest_weight_at: new Date().toISOString(),
  address_street: "Rua das Palmeiras",
  address_number: "120",
  address_complement: "Apto 302",
  address_neighborhood: "Savassi",
  address_city: "Belo Horizonte",
  address_state: "MG",
  address_zip: "30140071"
};

export const demoPatientsList = [
  demoPatient,
  {
    id: "demo-patient-002",
    full_name: "João Demo Santos",
    phone: "31988887777",
    goal: "Hipertrofia",
    cpf_masked: "***.123.456-**"
  }
];

export const demoNutritionist = {
  id: "demo-nutritionist-001",
  full_name: "Letícia Cunha",
  role: "nutritionist"
};

export const demoPaymentSettings = {
  consultation_price_cents: 25000,
  return_price_cents: 18000,
  currency: "BRL",
  instructions:
    "Após agendar, envie o comprovante (PDF ou foto) em Minhas consultas. A prescrição só libera após a validação.",
  cancellation_policy: "Cancelamentos com pelo menos 24h de antecedência."
};

export const demoPaymentMethods = [
  {
    id: "demo-pix",
    type: "pix",
    label: "PIX",
    details: { pixKey: "leticia.demo@email.com", instructions: "Preferencial" },
    sort_order: 0
  },
  {
    id: "demo-cash",
    type: "cash",
    label: "Dinheiro",
    details: { instructions: "No dia da consulta presencial" },
    sort_order: 1
  }
];

export const demoAvailabilityRules = [
  { id: "rule-1", weekday: 1, start_time: "09:00:00", end_time: "17:00:00", active: true },
  { id: "rule-2", weekday: 2, start_time: "09:00:00", end_time: "17:00:00", active: true },
  { id: "rule-3", weekday: 3, start_time: "09:00:00", end_time: "12:00:00", active: true },
  { id: "rule-4", weekday: 4, start_time: "09:00:00", end_time: "17:00:00", active: true }
];

export const demoDietPlan = {
  id: "diet-1",
  patient_id: patientId,
  title: "Plano alimentar FatSecret · semana 1",
  notes: "Beba 2L de água por dia. Evite ultraprocessados.",
  status: "active",
  source: "fatsecret_csv",
  created_at: pastDate(21, 11),
  diet_meals: [
    {
      id: "meal-1",
      name: "Café da manhã",
      sort_order: 0,
      diet_items: [
        {
          id: "item-1",
          label: "Aveia, flocos",
          quantity: 1,
          portion_g: 40,
          source: "fatsecret_csv",
          nutrition_snapshot: {
            kcal: 394,
            protein_g: 13.9,
            carbs_g: 66.6,
            fat_g: 8.5,
            measureUnit: "gramas",
            measureAmount: 40
          }
        },
        {
          id: "item-2",
          label: "Banana, nanica",
          quantity: 1,
          portion_g: 80,
          source: "fatsecret_csv",
          nutrition_snapshot: {
            kcal: 89,
            protein_g: 1.1,
            carbs_g: 22.8,
            fat_g: 0.3,
            measureUnit: "gramas",
            measureAmount: 80
          }
        }
      ]
    },
    {
      id: "meal-2",
      name: "Almoço",
      sort_order: 1,
      diet_items: [
        {
          id: "item-3",
          label: "Peito de frango, grelhado",
          quantity: 1,
          portion_g: 120,
          source: "fatsecret_csv",
          nutrition_snapshot: {
            kcal: 165,
            protein_g: 31,
            carbs_g: 0,
            fat_g: 3.6,
            measureUnit: "gramas",
            measureAmount: 120
          }
        },
        {
          id: "item-4",
          label: "Arroz, branco, cozido",
          quantity: 1,
          portion_g: 100,
          source: "fatsecret_csv",
          nutrition_snapshot: {
            kcal: 130,
            protein_g: 2.7,
            carbs_g: 28,
            fat_g: 0.3,
            measureUnit: "gramas",
            measureAmount: 100
          }
        }
      ]
    }
  ],
  diet_supplements: [
    {
      id: "sup-1",
      sort_order: 0,
      product_name: "Whey Protein Isolado",
      dosage: "30 g",
      posology: "1x ao dia, após o treino",
      notes: null
    },
    {
      id: "sup-2",
      sort_order: 1,
      product_name: "Vitamina D3",
      dosage: "2000 UI",
      posology: "1x ao dia, com o almoço",
      notes: null
    }
  ],
  diet_referrals: [
    {
      id: "ref-1",
      sort_order: 0,
      specialty: "Endocrinologista",
      professional_name: null,
      reason: "Avaliação de tireoide e metabolismo",
      urgency: "routine",
      notes: null
    }
  ],
  diet_exam_orders: [
    {
      id: "exam-1",
      sort_order: 0,
      title: "Pedido de exames",
      exams: [
        { name: "Hemograma completo", category: "principal" },
        { name: "Glicemia de jejum", category: "principal" },
        { name: "TSH", category: "principal" },
        {
          name: "Vitamina D (25-OH)",
          category: "complementary",
          whenToRequest: "Se não houver resultado recente (< 6 meses)"
        }
      ],
      collection_notes: ["Jejum de 8 a 12 horas", "Preferencialmente pela manhã"],
      observations: null,
      meta: {}
    }
  ]
};

export const demoLabReport = {
  id: "lab-1",
  status: "published",
  created_at: new Date().toISOString(),
  interpretation_summary:
    "Glicemia de jejum levemente elevada. Recomendo ajuste de carboidratos no café da manhã e novo controle em 30 dias.\n\nColesterol total dentro da meta.",
  ai_interpretation:
    "Glicemia de jejum: valor acima da referência cadastrada. Interpretação clínica integrada é responsabilidade da nutricionista.\n\nColesterol total: valor dentro da faixa de referência cadastrada.",
  uploaded_by: "nutritionist",
  published_by: "nutritionist",
  lab_results: [
    {
      id: "lr-1",
      marker_name: "Glicemia de jejum",
      value: 105,
      value_text: "105",
      unit: "mg/dL",
      ref_min: 70,
      ref_max: 99,
      flag: "high"
    },
    {
      id: "lr-2",
      marker_name: "Colesterol total",
      value: 185,
      unit: "mg/dL",
      ref_min: null,
      ref_max: 200,
      flag: "normal"
    }
  ]
};

const demoAiDraft =
  "Glicemia de jejum: valor acima da referência cadastrada. Sugere monitorar consumo de carboidratos refinados.\n\nColesterol total: valor dentro da faixa de referência cadastrada.";

export function createInitialLabReports() {
  return [
    {
      id: "lab-draft-1",
      patient_id: patientId,
      status: "draft",
      uploaded_by: "patient",
      published_by: null,
      created_at: futureDate(-2, 11),
      ai_interpretation: demoAiDraft,
      interpretation_summary: demoAiDraft,
      lab_results: demoLabReport.lab_results
    },
    {
      ...demoLabReport,
      patient_id: patientId
    }
  ];
}

export function getDemoPendingLabReports(reports) {
  return reports
    .filter((report) => report.status === "draft")
    .map((report) => ({
      ...report,
      patients: { full_name: demoPatient.full_name }
    }));
}

export const demoMeasurements = [
  { recorded_at: futureDate(-60, 10), weight_kg: 78.2 },
  { recorded_at: futureDate(-30, 10), weight_kg: 76.8 },
  { recorded_at: futureDate(-7, 10), weight_kg: 75.5 }
];

export const demoInsights = [
  {
    id: "ins-1",
    type: "computed",
    title: "Próxima consulta",
    body: "Sua consulta demo está marcada para os próximos dias.",
    visible_to_patient: true
  },
  {
    id: "ins-2",
    type: "computed",
    title: "Evolução de peso",
    body: "Entre as duas últimas medições houve redução de 1.3 kg.",
    visible_to_patient: true
  }
];

export const demoFoodResults = [
  {
    source: "tbca",
    externalId: "tbca-1",
    label: "Arroz, branco, cozido",
    per100g: { kcal: 128, protein_g: 2.5, carbs_g: 28.1, fat_g: 0.2, fiber_g: 1.6 },
    defaultPortionG: 100
  },
  {
    source: "taco",
    externalId: "taco-1",
    label: "Feijão, carioca, cozido",
    per100g: { kcal: 76, protein_g: 4.8, carbs_g: 13.6, fat_g: 0.5, fiber_g: 8.5 },
    defaultPortionG: 100
  },
  {
    source: "usda",
    externalId: "171477",
    label: "Chicken breast, raw",
    per100g: { kcal: 120, protein_g: 22.5, carbs_g: 0, fat_g: 2.6 },
    defaultPortionG: 100
  },
  {
    source: "fatsecret",
    externalId: "1641",
    label: "Peito de frango — Generic",
    foodType: "Generic",
    per100g: { kcal: 195, protein_g: 29.8, carbs_g: 0, fat_g: 7.7 },
    defaultPortionG: 100
  },
  {
    source: "fatsecret",
    externalId: "50953",
    label: "Whole Grain Cheerios — General Mills",
    foodType: "Brand",
    per100g: { kcal: 373, protein_g: 7.5, carbs_g: 81.3, fat_g: 4.4 },
    defaultPortionG: 100
  }
];

export function createInitialDemoState() {
  const startsAt = futureDate(3, 10);
  const endsAt = new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString();
  const pastStarts = pastDate(14, 10);
  const pastEnds = new Date(new Date(pastStarts).getTime() + 60 * 60 * 1000).toISOString();
  const validatedAt = pastDate(13, 16);

  return {
    patientProfile: { ...demoPatient },
    appointments: [
      {
        id: "appt-0",
        patient_id: patientId,
        starts_at: pastStarts,
        ends_at: pastEnds,
        duration_min: 60,
        buffer_min: 15,
        type: "consultation",
        status: "completed",
        payment_status: "paid",
        amount_cents: 25000,
        payment_validated_at: validatedAt,
        payment_validated_by: demoNutritionist.id,
        meet_link: null,
        patients: { full_name: demoPatient.full_name, phone: demoPatient.phone }
      },
      {
        id: "appt-1",
        patient_id: patientId,
        starts_at: startsAt,
        ends_at: endsAt,
        duration_min: 60,
        buffer_min: 15,
        type: "consultation",
        status: "scheduled",
        payment_status: "pending",
        amount_cents: 25000,
        meet_link: "https://meet.google.com/demo-leticia-consulta",
        patients: { full_name: demoPatient.full_name, phone: demoPatient.phone }
      }
    ],
    appointmentDocuments: [
      {
        id: "doc-proof-0",
        appointment_id: "appt-0",
        patient_id: patientId,
        doc_type: "payment_proof",
        storage_path: "demo/appt-0/proof.pdf",
        mime_type: "application/pdf",
        file_name: "comprovante-pix.pdf",
        uploaded_by_role: "patient",
        extracted_amount_cents: 25000,
        extracted_paid_at: pastDate(13, 15),
        extracted_payer_name: demoPatient.full_name,
        extraction_status: "ok",
        extraction_json: { method: "demo", confidence: 1 },
        amount_matches: true,
        url: null,
        created_at: pastDate(13, 15)
      },
      {
        id: "doc-invoice-0",
        appointment_id: "appt-0",
        patient_id: patientId,
        doc_type: "invoice",
        storage_path: "demo/appt-0/nf.pdf",
        mime_type: "application/pdf",
        file_name: "nota-fiscal.pdf",
        uploaded_by_role: "nutritionist",
        extracted_amount_cents: 25000,
        extracted_paid_at: pastDate(13, 18),
        extracted_payer_name: demoPatient.full_name,
        extraction_status: "ok",
        extraction_json: { method: "demo", confidence: 1, matchesExpected: true, matchesProof: true },
        amount_matches: true,
        url: null,
        created_at: pastDate(13, 18)
      }
    ],
    photos: [],
    availabilityRules: [...demoAvailabilityRules],
    availabilityBlocks: [],
    paymentSettings: { ...demoPaymentSettings },
    paymentMethods: [...demoPaymentMethods],
    googleConnected: false,
    labReports: createInitialLabReports(),
    dietPlans: [{ ...demoDietPlan }],
    clinicalRecords: [
      {
        id: "clinical-1",
        patient_id: patientId,
        appointment_id: "appt-0",
        session_at: pastDate(21, 10),
        title: "Consulta inicial · anamnese",
        body_text: `Paciente: Maria Demo Silva

Queixa: dificuldade em manter rotina alimentar no jantar.

Avaliação: peso 68 kg; meta −4 kg em 3 meses; rotina sedentária.

Conduta: iniciar plano com foco em café da manhã estruturado.

Próximos passos: retorno em 3 semanas com registro alimentar.`,
        notes: null,
        storage_path: null,
        mime_type: "text/plain",
        file_name: null,
        created_at: pastDate(21, 11),
        updated_at: pastDate(21, 11)
      },
      {
        id: "clinical-2",
        patient_id: patientId,
        appointment_id: null,
        session_at: pastDate(7, 15),
        title: "Retorno · reavaliação",
        body_text: `Revisão de adesão e ajuste de porções.

Evolução: adesão boa ao café da manhã; jantar ainda irregular. Relata mais energia; mantém treino 2x/semana.

Conduta: ajuste de porções no jantar e reforço de proteína.

Próximos passos: retorno em 30 dias.`,
        notes: null,
        storage_path: null,
        mime_type: "text/plain",
        file_name: null,
        created_at: pastDate(7, 16),
        updated_at: pastDate(7, 16)
      }
    ],
    presets: []
  };
}

export function generateDemoSlots(fromIso, toIso) {
  return generateSlotsFromRules({
    from: new Date(fromIso),
    to: new Date(toIso),
    rules: demoAvailabilityRules
  }).slice(0, 24);
}

export { patientId };
