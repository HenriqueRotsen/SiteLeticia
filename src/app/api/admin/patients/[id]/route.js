import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { maskCpf } from "@/lib/cpf";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { patientAnthropometricsSchema } from "@/lib/validation/schemas";
import { writeAuditLog, getClientIp } from "@/lib/audit";

function normalizeBirthDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function mapPatientResponse(patient, latestMeasurement) {
  return {
    ...patient,
    birth_date: normalizeBirthDate(patient.birth_date),
    height_cm: patient.height_cm != null ? Number(patient.height_cm) : null,
    body_fat_percent:
      patient.body_fat_percent != null ? Number(patient.body_fat_percent) : null,
    cpf_masked: maskCpf(patient.cpf),
    cpf: undefined,
    has_account: Boolean(patient.user_id),
    from_waitlist: patient.source === "waitlist" || Boolean(patient.waitlist_id),
    latest_weight_kg:
      latestMeasurement?.weight_kg != null ? Number(latestMeasurement.weight_kg) : null,
    latest_weight_at: latestMeasurement?.recorded_at ?? null
  };
}

async function getLatestMeasurement(supabase, patientId) {
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

function mapDbError(error) {
  const message = error?.message || "";

  if (message.includes("column") && message.includes("does not exist")) {
    return "Banco desatualizado: execute supabase/migrate-patient-anthropometrics.sql no Supabase.";
  }

  return "Erro ao salvar dados do paciente.";
}

export async function GET(_request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json({ message: "Supabase admin não configurado." }, { status: 503 });
  }

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    console.error("Patient GET failed:", error);
    return NextResponse.json({ message: "Erro ao carregar paciente." }, { status: 500 });
  }

  if (!patient) {
    return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
  }

  const latestMeasurement = await getLatestMeasurement(supabase, params.id);

  return NextResponse.json({
    patient: mapPatientResponse(patient, latestMeasurement)
  });
}

export async function PATCH(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = patientAnthropometricsSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados antropométricos inválidos." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json({ message: "Supabase admin não configurado." }, { status: 503 });
  }

  const updates = {
    updated_at: new Date().toISOString()
  };

  if (body.sex !== undefined) updates.sex = body.sex;
  if (body.birthDate !== undefined) updates.birth_date = body.birthDate;
  if (body.heightCm !== undefined) updates.height_cm = body.heightCm;
  if (body.bodyFatPercent !== undefined) updates.body_fat_percent = body.bodyFatPercent;
  if (body.activityLevel !== undefined) updates.activity_level = body.activityLevel;

  const { data: patient, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error || !patient) {
    console.error("Patient PATCH failed:", error);
    return NextResponse.json({ message: mapDbError(error) }, { status: 500 });
  }

  if (body.weightKg != null) {
    const { error: weightError } = await supabase.from("body_measurements").insert({
      patient_id: params.id,
      weight_kg: body.weightKg,
      recorded_at: new Date().toISOString()
    });

    if (weightError) {
      console.error("Weight measurement insert failed:", weightError);
      return NextResponse.json({ message: "Dados salvos, mas não foi possível registrar o peso." }, { status: 500 });
    }
  }

  const latestMeasurement = await getLatestMeasurement(supabase, params.id);

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "patient_anthropometrics_update",
    resourceType: "patient",
    resourceId: params.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    patient: mapPatientResponse(patient, latestMeasurement)
  });
}
