import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { maskCpf } from "@/lib/cpf";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { patientSearchFilter, waitlistPositions } from "@/lib/waitlist/patient-search";

function earliestDate(...values) {
  const times = values.filter(Boolean).map((value) => new Date(value).getTime()).filter(Number.isFinite);
  return times.length ? new Date(Math.min(...times)).toISOString() : null;
}

export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch (error) {
    console.error("Admin patients list: supabase admin unavailable", error);
    return NextResponse.json(
      { message: "Serviço de pacientes indisponível no momento." },
      { status: 500 }
    );
  }

  // Lista via service role para não depender de RLS/sessão e evitar timeout de sync.
  let query = admin
    .from("patients")
    .select("id, full_name, phone, goal, cpf, user_id, source, waitlist_id, created_at")
    .order("created_at", { ascending: false });

  const searchFilter = patientSearchFilter(q);
  if (searchFilter) {
    query = query.or(searchFilter);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Admin patients list failed:", error);
    return NextResponse.json({ message: "Erro ao listar." }, { status: 500 });
  }

  let waitlistStats = null;
  let positions = new Map();
  try {
    const { data: entries, error: waitlistError } = await admin
      .from("waitlist")
      .select("id, status, created_at, converted_patient_id");
    if (waitlistError) throw waitlistError;
    positions = waitlistPositions(entries || []);
    waitlistStats = {
      total: (entries || []).length,
      waiting: (entries || []).filter((entry) => entry.status === "waiting").length,
      unlinked: (entries || []).filter((entry) => !entry.converted_patient_id).length
    };
  } catch (statsError) {
    console.error("Waitlist stats failed:", statsError);
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "patients_list",
    resourceType: "patients",
    resourceId: null,
    ip: getClientIp(request)
  });

  const patients = (data || []).map((p) => {
    const entry = p.waitlist_id ? positions.get(p.waitlist_id) : null;
    return {
      ...p,
      cpf_masked: maskCpf(p.cpf),
      cpf: undefined,
      has_account: Boolean(p.user_id),
      // Só conta como fila quem ainda tem cadastro na fila (removidos saem daqui).
      from_waitlist: Boolean(entry),
      waitlist_status: entry?.status || null,
      waitlist_position: entry?.position ?? null,
      waitlist_joined_at: entry?.createdAt || null,
      // Quem veio da fila foi importado depois (ex.: 30/08); vale a data do cadastro original.
      registered_at: earliestDate(p.created_at, entry?.createdAt)
    };
  });

  if (waitlistStats) {
    waitlistStats.withoutAccount = patients.filter((p) => p.from_waitlist && !p.has_account).length;
    waitlistStats.withAccount = patients.filter((p) => p.from_waitlist && p.has_account).length;
  }

  return NextResponse.json({
    patients,
    waitlistStats
  });
}

export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { hashCpf, normalizeCpf, isValidCpf } = await import("@/lib/cpf");

  const phone = String(body.phone).replace(/\D/g, "");
  if (!body.fullName?.trim() || !phone || !body.goal) {
    return NextResponse.json({ message: "Nome, telefone e objetivo são obrigatórios." }, { status: 400 });
  }

  let cpf = null;
  let cpfHash = null;
  if (body.cpf) {
    if (!isValidCpf(body.cpf)) {
      return NextResponse.json({ message: "CPF inválido." }, { status: 400 });
    }
    cpf = normalizeCpf(body.cpf);
    cpfHash = hashCpf(cpf);
  }

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch {
    return NextResponse.json({ message: "Erro ao criar paciente." }, { status: 500 });
  }

  const { data, error } = await admin
    .from("patients")
    .insert({
      cpf,
      cpf_hash: cpfHash,
      full_name: body.fullName.trim(),
      phone,
      goal: body.goal,
      source: "admin"
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const message = error.message?.includes("phone")
        ? "Telefone já cadastrado."
        : "CPF já cadastrado.";
      return NextResponse.json({ message }, { status: 409 });
    }
    return NextResponse.json({ message: "Erro ao criar paciente." }, { status: 500 });
  }

  return NextResponse.json({ patient: data });
}
