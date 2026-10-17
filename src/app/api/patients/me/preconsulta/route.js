import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  emptyPreconsultAnswers,
  mergePrefillAnswers,
  normalizePreconsultAnswers,
  validatePreconsultAnswers
} from "@/lib/preconsult/schema";
import { writeAuditLog, getClientIp } from "@/lib/audit";

async function countPriorAppointments(supabase, patientId) {
  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", patientId)
    .in("status", ["scheduled", "completed"]);
  return count || 0;
}

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const patientId = auth.ctx.patient.id;

  const [{ data: form, error: formError }, priorCount] = await Promise.all([
    supabase.from("patient_preconsult_forms").select("*").eq("patient_id", patientId).maybeSingle(),
    countPriorAppointments(supabase, patientId)
  ]);

  if (formError) {
    console.error("Preconsult GET failed:", formError);
    return NextResponse.json(
      {
        message:
          formError.message?.includes("patient_preconsult_forms") || formError.code === "42P01"
            ? "Banco desatualizado: execute supabase/migrate-preconsult-forms.sql no Supabase."
            : "Não foi possível carregar a ficha pré-consulta.",
        required: priorCount === 0,
        priorAppointments: priorCount
      },
      { status: 500 }
    );
  }

  const required = priorCount === 0 && form?.status !== "submitted";
  const patient = auth.ctx.patient;
  const answers = mergePrefillAnswers(form?.answers || emptyPreconsultAnswers(), patient);

  return NextResponse.json({
    form: form
      ? {
          ...form,
          answers
        }
      : {
          patient_id: patientId,
          answers,
          status: "draft",
          submitted_at: null
        },
    patient: {
      full_name: patient.full_name,
      birth_date: patient.birth_date,
      goal: patient.goal
    },
    required,
    priorAppointments: priorCount
  });
}

export async function PUT(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const submit = body.submit !== false;
  const merged = mergePrefillAnswers(body.answers || {}, auth.ctx.patient);
  const validation = validatePreconsultAnswers(merged);

  if (submit && !validation.ok) {
    return NextResponse.json(
      {
        message: `Preencha os campos obrigatórios: ${validation.missing.join("; ")}`
      },
      { status: 400 }
    );
  }

  const answers = validation.answers;
  const supabase = createSupabaseAdmin();
  const patientId = auth.ctx.patient.id;
  const now = new Date().toISOString();

  const payload = {
    patient_id: patientId,
    answers,
    status: submit ? "submitted" : "draft",
    submitted_at: submit ? now : null,
    updated_at: now
  };

  const { data: form, error } = await supabase
    .from("patient_preconsult_forms")
    .upsert(payload, { onConflict: "patient_id" })
    .select("*")
    .single();

  if (error) {
    console.error("Preconsult upsert failed:", error);
    const message =
      error.message?.includes("patient_preconsult_forms") || error.code === "42P01"
        ? "Banco desatualizado: execute supabase/migrate-preconsult-forms.sql no Supabase."
        : "Não foi possível salvar a ficha.";
    return NextResponse.json({ message }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: submit ? "preconsult.submit" : "preconsult.draft",
    resourceType: "patient_preconsult_forms",
    resourceId: form.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    form: {
      ...form,
      answers: normalizePreconsultAnswers(form.answers || {})
    }
  });
}
