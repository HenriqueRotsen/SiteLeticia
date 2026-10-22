import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { normalizePreconsultAnswers } from "@/lib/preconsult/schema";

export async function GET(_request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const patientId = params.id;

  const [{ data: patient }, { data: form, error }] = await Promise.all([
    supabase.from("patients").select("id, full_name").eq("id", patientId).maybeSingle(),
    supabase.from("patient_preconsult_forms").select("*").eq("patient_id", patientId).maybeSingle()
  ]);

  if (!patient) {
    return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
  }

  if (error) {
    console.error("Preconsult GET (admin) failed:", error);
    const message =
      error.message?.includes("patient_preconsult_forms") || error.code === "42P01"
        ? "Banco desatualizado: execute supabase/migrate-preconsult-forms.sql no Supabase."
        : "Erro ao carregar a ficha.";
    return NextResponse.json({ message }, { status: 500 });
  }

  return NextResponse.json({
    patient: { id: patient.id, full_name: patient.full_name },
    form: form
      ? {
          ...form,
          answers: normalizePreconsultAnswers(form.answers || {})
        }
      : null
  });
}
