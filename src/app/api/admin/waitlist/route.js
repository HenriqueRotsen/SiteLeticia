import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

// Tabelas com dados do paciente: se houver algo, o paciente fica (só sai da fila).
const PATIENT_DATA_TABLES = [
  "appointments",
  "clinical_records",
  "diet_plans",
  "body_measurements",
  "lab_reports",
  "progress_photos",
  "patient_preconsult_forms",
  "patient_packages",
  "diet_checkins"
];

// Remove o paciente criado automaticamente pela fila quando ele ainda não tem
// conta nem nenhum dado — assim um cadastro apagado da fila some de Pacientes também.
async function removeEmptyWaitlistPatient(supabase, waitlistId, patientId) {
  const filter = patientId ? ["id", patientId] : ["waitlist_id", waitlistId];
  const { data: patient } = await supabase
    .from("patients")
    .select("id, user_id, source")
    .eq(filter[0], filter[1])
    .maybeSingle();
  if (!patient || patient.user_id || patient.source !== "waitlist") return false;

  for (const table of PATIENT_DATA_TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("patient_id", patient.id);
    if (error && error.code !== "42P01" && error.code !== "PGRST205") return false;
    if (count) return false;
  }

  const { error } = await supabase.from("patients").delete().eq("id", patient.id);
  return !error;
}

function unauthorized() {
  return NextResponse.json({ message: "Sessão admin inválida." }, { status: 401 });
}

function getSession(request) {
  return request.cookies.get(ADMIN_COOKIE_NAME)?.value;
}

export async function GET(request) {
  if (!verifyAdminSession(getSession(request))) return unauthorized();

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Chave service_role do Supabase não configurada." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("waitlist")
    .select("id, full_name, phone, goal, status, created_at")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível carregar a lista." },
      { status: 500 }
    );
  }

  return NextResponse.json({ waitlist: data });
}

export async function PATCH(request) {
  if (!verifyAdminSession(getSession(request))) return unauthorized();

  const { id, status } = await request.json();

  if (!id || !["waiting", "called"].includes(status)) {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Chave service_role do Supabase não configurada." },
      { status: 500 }
    );
  }

  const { error } = await supabase.from("waitlist").update({ status }).eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível atualizar o cadastro." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!verifyAdminSession(getSession(request))) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Chave service_role do Supabase não configurada." },
      { status: 500 }
    );
  }

  const { data: entry } = await supabase
    .from("waitlist")
    .select("id, converted_patient_id")
    .eq("id", id)
    .maybeSingle();

  let patientRemoved = false;
  if (entry) {
    try {
      patientRemoved = await removeEmptyWaitlistPatient(supabase, entry.id, entry.converted_patient_id);
    } catch (cleanupError) {
      console.error("Waitlist patient cleanup failed:", cleanupError);
    }
  }

  const { error } = await supabase.from("waitlist").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível remover o cadastro." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, patientRemoved });
}
