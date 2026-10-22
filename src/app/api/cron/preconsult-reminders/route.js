import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { preconsultEmail, sendEmail } from "@/lib/email/resend";

const HOUR = 60 * 60 * 1000;

/**
 * Lembretes da ficha pré-consulta: 1 dia e 1 hora antes da 1ª consulta,
 * só para quem ainda não enviou a ficha. Chame de 15 em 15 minutos
 * (ver .github/workflows/preconsult-reminders.yml).
 */
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ message: "CRON_SECRET não configurada." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json({ message: "Supabase admin não configurado." }, { status: 500 });
  }

  const now = Date.now();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("status", "scheduled")
    .gt("starts_at", new Date(now).toISOString())
    .lte("starts_at", new Date(now + 24 * HOUR).toISOString());

  if (error) {
    return NextResponse.json({ message: "Não foi possível ler as consultas." }, { status: 500 });
  }

  const candidates = (appointments || []).filter((appt) => {
    const startsAt = new Date(appt.starts_at).getTime();
    const createdAt = appt.created_at ? new Date(appt.created_at).getTime() : 0;
    const msLeft = startsAt - now;
    // Só lembra quem agendou com antecedência (quem agendou em cima da hora já recebeu o convite).
    if (msLeft <= HOUR + 15 * 60 * 1000) {
      return !appt.preconsult_hour_reminder_at && createdAt <= startsAt - HOUR;
    }
    return !appt.preconsult_day_reminder_at && createdAt <= startsAt - 24 * HOUR;
  });

  if (!candidates.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const patientIds = [...new Set(candidates.map((appt) => appt.patient_id))];
  const [{ data: patients }, { data: forms }, { data: earlier }] = await Promise.all([
    supabase.from("patients").select("id, full_name, user_id").in("id", patientIds),
    supabase.from("patient_preconsult_forms").select("patient_id, status").in("patient_id", patientIds),
    supabase
      .from("appointments")
      .select("patient_id, starts_at")
      .in("patient_id", patientIds)
      .in("status", ["scheduled", "completed"])
  ]);

  const submitted = new Set((forms || []).filter((f) => f.status === "submitted").map((f) => f.patient_id));
  const patientById = Object.fromEntries((patients || []).map((p) => [p.id, p]));

  let sent = 0;
  const failures = [];

  for (const appt of candidates) {
    if (submitted.has(appt.patient_id)) continue;

    // Apenas a primeira consulta do paciente.
    const hasEarlier = (earlier || []).some(
      (other) =>
        other.patient_id === appt.patient_id &&
        new Date(other.starts_at).getTime() < new Date(appt.starts_at).getTime()
    );
    if (hasEarlier) continue;

    const patient = patientById[appt.patient_id];
    if (!patient?.user_id) continue;

    const msLeft = new Date(appt.starts_at).getTime() - now;
    const kind = msLeft <= HOUR + 15 * 60 * 1000 ? "hour" : "day";
    const column = kind === "hour" ? "preconsult_hour_reminder_at" : "preconsult_day_reminder_at";

    try {
      const { data: userData } = await supabase.auth.admin.getUserById(patient.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      const message = preconsultEmail({
        kind,
        fullName: patient.full_name,
        startsAt: appt.starts_at,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL
      });
      await sendEmail({ to: email, ...message });

      const { error: markError } = await supabase
        .from("appointments")
        .update({ [column]: new Date().toISOString() })
        .eq("id", appt.id);
      if (markError) failures.push(`marcar ${appt.id}: ${markError.message}`);
      sent += 1;
    } catch (err) {
      failures.push(`${appt.id}: ${err?.message || err}`);
    }
  }

  return NextResponse.json({ ok: failures.length === 0, sent, failures });
}
