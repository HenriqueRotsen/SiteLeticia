import { maskCpf } from "@/lib/cpf";

export function normalizeBirthDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

export async function getLatestMeasurement(supabase, patientId) {
  const { data } = await supabase
    .from("body_measurements")
    .select("weight_kg, recorded_at")
    .eq("patient_id", patientId)
    .not("weight_kg", "is", null)
    .order("recorded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export function mapPatientProfileResponse(patient, latestMeasurement, extras = {}) {
  return {
    id: patient.id,
    full_name: patient.full_name,
    phone: patient.phone,
    goal: patient.goal,
    cpf_masked: maskCpf(patient.cpf),
    sex: patient.sex ?? null,
    birth_date: normalizeBirthDate(patient.birth_date),
    height_cm: patient.height_cm != null ? Number(patient.height_cm) : null,
    body_fat_percent:
      patient.body_fat_percent != null ? Number(patient.body_fat_percent) : null,
    activity_level: patient.activity_level ?? null,
    address_street: patient.address_street ?? null,
    address_number: patient.address_number ?? null,
    address_complement: patient.address_complement ?? null,
    address_neighborhood: patient.address_neighborhood ?? null,
    address_city: patient.address_city ?? null,
    address_state: patient.address_state ?? null,
    address_zip: patient.address_zip ?? null,
    latest_weight_kg:
      latestMeasurement?.weight_kg != null ? Number(latestMeasurement.weight_kg) : null,
    latest_weight_at: latestMeasurement?.recorded_at ?? null,
    ...extras
  };
}

export function mapPatientProfileDbError(error) {
  const message = error?.message || "";

  if (message.includes("column") && message.includes("does not exist")) {
    return "Banco desatualizado: execute supabase/migrate-patient-profile.sql no Supabase.";
  }

  if (message.includes("patients_phone_unique")) {
    return "Este WhatsApp já está cadastrado em outra conta.";
  }

  return "Erro ao salvar perfil.";
}
