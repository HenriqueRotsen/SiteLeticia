import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requirePatient } from "@/lib/auth";
import { appointmentCreateSchema } from "@/lib/validation/schemas";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  appointmentEnd,
  blockedUntil,
  overlapsWithBuffer
} from "@/lib/scheduling/slots";
import {
  CONSULTATION_BUFFER_MIN,
  CONSULTATION_DURATION_MIN
} from "@/lib/constants";
import {
  createGoogleCalendarEvent,
  getGoogleAccessToken
} from "@/lib/google/calendar";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function POST(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  let body;
  try {
    body = appointmentCreateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  const endsAt = appointmentEnd(startsAt);
  const supabase = createSupabaseAdmin();

  const { data: settings } = await supabase.from("payment_settings").select("*").limit(1).maybeSingle();
  const priceCents =
    body.type === "return" && settings?.return_price_cents != null
      ? settings.return_price_cents
      : settings?.consultation_price_cents || 0;

  const { data: existing } = await supabase
    .from("appointments")
    .select("starts_at, status")
    .eq("status", "scheduled")
    .gte("starts_at", new Date(startsAt.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .lte("starts_at", new Date(startsAt.getTime() + 24 * 60 * 60 * 1000).toISOString());

  const conflict = (existing || []).some((row) => overlapsWithBuffer(new Date(row.starts_at), startsAt));
  if (conflict) {
    return NextResponse.json({ message: "Horário indisponível." }, { status: 409 });
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: auth.ctx.patient.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_min: CONSULTATION_DURATION_MIN,
      buffer_min: CONSULTATION_BUFFER_MIN,
      type: body.type,
      status: "scheduled",
      payment_status: "pending",
      amount_cents: priceCents
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: "Não foi possível agendar." }, { status: 500 });
  }

  let meetLink = null;
  let googleEventId = null;
  let calendarWarning = null;

  const { data: nutritionist } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "nutritionist")
    .limit(1)
    .maybeSingle();

  if (nutritionist && process.env.GOOGLE_CLIENT_ID) {
    try {
      const token = await getGoogleAccessToken(nutritionist.id);
      if (token) {
        const event = await createGoogleCalendarEvent({
          accessToken: token,
          summary: `Consulta nutricional — ${auth.ctx.patient.full_name}`,
          description: `Paciente: ${auth.ctx.patient.full_name}\nTipo: ${body.type}`,
          startIso: startsAt.toISOString(),
          endIso: endsAt.toISOString(),
          attendeeEmail: auth.ctx.user.email,
          requestId: `appt-${appointment.id}-${randomUUID()}`
        });
        meetLink = event.meetLink;
        googleEventId = event.googleEventId;

        await supabase
          .from("appointments")
          .update({ meet_link: meetLink, google_event_id: googleEventId })
          .eq("id", appointment.id);
      }
    } catch {
      calendarWarning = "Consulta agendada, mas o Google Meet não pôde ser criado.";
    }
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "appointment_create",
    resourceType: "appointment",
    resourceId: appointment.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    appointment: { ...appointment, meet_link: meetLink, google_event_id: googleEventId },
    calendarWarning
  });
}

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { data, error } = await auth.ctx.supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", auth.ctx.patient.id)
    .order("starts_at", { ascending: true });

  if (error) {
    return NextResponse.json({ message: "Erro ao carregar consultas." }, { status: 500 });
  }

  return NextResponse.json({ appointments: data || [] });
}
