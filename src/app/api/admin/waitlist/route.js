import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { getSiteUrl } from "@/lib/site-url";
import { waitlistPositions } from "@/lib/waitlist/patient-search";
import { clampBatchSize, outOfOrderIds } from "@/lib/waitlist/notify";

// Fila de espera da Letícia: lista em ordem, aviso das próximas pessoas e ajustes.
// A coluna called_at (data do aviso) vem de supabase/migrate-fila-avisos.sql;
// sem ela, tudo funciona, só não aparece a data do aviso.

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

function isMissingColumn(error) {
  return error?.code === "42703" || error?.code === "PGRST204" || /called_at/.test(error?.message || "");
}

function adminClient() {
  try {
    return { supabase: createSupabaseAdmin() };
  } catch {
    return {
      error: NextResponse.json({ message: "Chave service_role do Supabase não configurada." }, { status: 500 })
    };
  }
}

async function loadEntries(supabase) {
  let result = await supabase
    .from("waitlist")
    .select("id, full_name, phone, goal, status, created_at, converted_patient_id, called_at")
    .order("id", { ascending: true });
  let hasCalledAt = true;
  if (result.error && isMissingColumn(result.error)) {
    hasCalledAt = false;
    result = await supabase
      .from("waitlist")
      .select("id, full_name, phone, goal, status, created_at, converted_patient_id")
      .order("id", { ascending: true });
  }
  if (result.error) throw result.error;
  return { entries: result.data || [], hasCalledAt };
}

async function markCalled(supabase, ids, hasCalledAt) {
  const update = hasCalledAt ? { status: "called", called_at: new Date().toISOString() } : { status: "called" };
  let { error } = await supabase.from("waitlist").update(update).in("id", ids).eq("status", "waiting");
  if (error && isMissingColumn(error)) {
    ({ error } = await supabase.from("waitlist").update({ status: "called" }).in("id", ids).eq("status", "waiting"));
  }
  return error;
}

export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;
  const { supabase, error: clientError } = adminClient();
  if (clientError) return clientError;

  let loaded;
  try {
    loaded = await loadEntries(supabase);
  } catch (error) {
    console.error("Waitlist list failed:", error);
    return NextResponse.json({ message: "Não foi possível carregar a fila." }, { status: 500 });
  }

  const patientIds = loaded.entries.map((entry) => entry.converted_patient_id).filter(Boolean);
  const accounts = new Map();
  if (patientIds.length) {
    const { data } = await supabase.from("patients").select("id, user_id").in("id", patientIds);
    for (const row of data || []) accounts.set(row.id, Boolean(row.user_id));
  }

  const positions = waitlistPositions(loaded.entries);
  const waitlist = loaded.entries.map((entry) => ({
    ...entry,
    called_at: entry.called_at || null,
    position: positions.get(entry.id)?.position ?? null,
    has_account: accounts.get(entry.converted_patient_id) || false
  }));

  return NextResponse.json({
    waitlist,
    signupLink: `${getSiteUrl(request)}/criar-conta`,
    hasCalledAt: loaded.hasCalledAt
  });
}

// Marca como avisadas. Só aceita pessoas dentro das próximas `batchSize` da fila,
// para ninguém ser avisado antes de quem entrou primeiro.
export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;
  const { supabase, error: clientError } = adminClient();
  if (clientError) return clientError;

  const body = await request.json().catch(() => ({}));
  const ids = [...new Set((Array.isArray(body.ids) ? body.ids : []).map(Number).filter(Number.isInteger))];
  if (!ids.length) {
    return NextResponse.json({ message: "Nenhuma pessoa selecionada." }, { status: 400 });
  }

  let loaded;
  try {
    loaded = await loadEntries(supabase);
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar a fila." }, { status: 500 });
  }

  const blocked = outOfOrderIds(loaded.entries, ids, clampBatchSize(body.batchSize));
  if (blocked.length) {
    return NextResponse.json(
      { message: "Essa pessoa não está entre as próximas da fila. Atualize a lista e avise na ordem.", blocked },
      { status: 409 }
    );
  }

  const error = await markCalled(supabase, ids, loaded.hasCalledAt);
  if (error) {
    console.error("Waitlist notify failed:", error);
    return NextResponse.json({ message: "Não foi possível registrar o aviso." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "waitlist_notify",
    resourceType: "waitlist",
    resourceId: ids.join(","),
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true, ids });
}

// Volta para a fila (mantém a posição original) ou marca como avisada manualmente.
export async function PATCH(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;
  const { supabase, error: clientError } = adminClient();
  if (clientError) return clientError;

  const { id, status } = await request.json().catch(() => ({}));
  if (!id || status !== "waiting") {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  let { error } = await supabase.from("waitlist").update({ status: "waiting", called_at: null }).eq("id", id);
  if (error && isMissingColumn(error)) {
    ({ error } = await supabase.from("waitlist").update({ status: "waiting" }).eq("id", id));
  }
  if (error) {
    return NextResponse.json({ message: "Não foi possível atualizar o cadastro." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "waitlist_back_to_queue",
    resourceType: "waitlist",
    resourceId: id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;
  const { supabase, error: clientError } = adminClient();
  if (clientError) return clientError;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });
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
    return NextResponse.json({ message: "Não foi possível remover o cadastro." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "waitlist_remove",
    resourceType: "waitlist",
    resourceId: id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true, patientRemoved });
}
