import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { adminAppointmentCreateSchema } from "@/lib/validation/schemas";
import { appointmentEnd, overlapsWithBuffer } from "@/lib/scheduling/slots";
import { CONSULTATION_BUFFER_MIN, CONSULTATION_DURATION_MIN } from "@/lib/constants";
import { createGoogleCalendarEvent, getGoogleAccessToken } from "@/lib/google/calendar";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { appointmentScheduledEmail, sendEmail } from "@/lib/email/resend";
import { getSiteUrl } from "@/lib/site-url";
import { formatAddress, googleMapsLink, isAddressComplete } from "@/lib/appointments/location";
import { appointmentWhatsappLink } from "@/lib/appointments/whatsapp";
import { packageAppointmentFields, releasePackageCredit, reservePackageCredit } from "@/lib/packages/credits";
import { CARD_MIGRATION_MESSAGE, consultationPaymentOptions, isMissingPaymentColumn, paymentMethodLabel, pickOption } from "@/lib/payments/card";

export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const patientId = request.nextUrl.searchParams.get("patientId");

  let query = auth.ctx.supabase
    .from("appointments")
    .select("*, patients(full_name, phone)")
    .order("starts_at", { ascending: false })
    .limit(100);

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  const { data } = await query;

  return NextResponse.json({ appointments: data || [] });
}

const MIGRATION_MESSAGE =
  "Para marcar consultas presenciais é preciso rodar o SQL migrate-presencial-pacotes-pix.sql no Supabase.";

// A nutricionista marca a consulta para o paciente (online com Meet, ou presencial com endereço).
export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = adminAppointmentCreateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const startsAt = new Date(body.startsAt);
  const endsAt = appointmentEnd(startsAt);
  const inPerson = body.modality === "in_person";

  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name, phone, user_id")
    .eq("id", body.patientId)
    .maybeSingle();
  if (!patient) {
    return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
  }

  const { data: settings, error: settingsError } = await supabase
    .from("payment_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  if (settingsError) {
    return NextResponse.json({ message: "Não foi possível ler as configurações." }, { status: 500 });
  }

  let location = null;
  if (inPerson) {
    if (!("clinic_address" in (settings || {})) && settings) {
      return NextResponse.json({ message: MIGRATION_MESSAGE }, { status: 503 });
    }
    if (!isAddressComplete(settings?.clinic_address)) {
      return NextResponse.json(
        {
          message:
            "Cadastre o endereço de atendimento em Configurações → Endereço de atendimento antes de marcar consulta presencial."
        },
        { status: 400 }
      );
    }
    location = formatAddress(settings.clinic_address);
  }

  const { data: existing } = await supabase
    .from("appointments")
    .select("starts_at, status")
    .eq("status", "scheduled")
    .gte("starts_at", new Date(startsAt.getTime() - 24 * 60 * 60 * 1000).toISOString())
    .lte("starts_at", new Date(startsAt.getTime() + 24 * 60 * 60 * 1000).toISOString());
  if ((existing || []).some((row) => overlapsWithBuffer(new Date(row.starts_at), startsAt))) {
    return NextResponse.json({ message: "Já existe uma consulta nesse horário." }, { status: 409 });
  }

  const payment = pickOption(consultationPaymentOptions(settings || {}), body.paymentMethod);

  // Paciente com pacote pago e saldo: a consulta usa um crédito (sai paga, valor 0).
  const usedPackage = await reservePackageCredit(supabase, patient.id);

  const insert = {
    patient_id: patient.id,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    duration_min: CONSULTATION_DURATION_MIN,
    buffer_min: CONSULTATION_BUFFER_MIN,
    type: "consultation",
    status: "scheduled",
    payment_status: "pending",
    amount_cents: payment.cents,
    notes: body.notes || null,
    // Cartão só é gravado quando escolhido: PIX funciona mesmo antes da migração do cartão.
    ...(payment.method === "card" ? { payment_method: "card" } : {}),
    // Só manda as colunas novas quando precisa: consulta online funciona mesmo antes da migração.
    ...(inPerson ? { modality: "in_person", location } : {}),
    ...packageAppointmentFields(usedPackage)
  };

  const { data: appointment, error } = await supabase.from("appointments").insert(insert).select("*").single();
  if (error) {
    await releasePackageCredit(supabase, usedPackage?.id);
    if (/modality|location/.test(String(error.message || ""))) {
      return NextResponse.json({ message: MIGRATION_MESSAGE }, { status: 503 });
    }
    if (isMissingPaymentColumn(error)) {
      return NextResponse.json({ message: CARD_MIGRATION_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ message: "Não foi possível marcar a consulta." }, { status: 500 });
  }

  let patientEmail = null;
  if (patient.user_id) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(patient.user_id);
      patientEmail = userData?.user?.email || null;
    } catch {
      patientEmail = null;
    }
  }

  const mapsUrl = inPerson ? googleMapsLink(location) : null;
  let meetLink = null;
  let googleEventId = null;
  let calendarWarning = null;

  if (process.env.GOOGLE_CLIENT_ID) {
    try {
      const token = await getGoogleAccessToken(auth.ctx.user.id);
      if (!token) {
        calendarWarning = "Consulta marcada, mas o Google Agenda não está conectado. Reconecte em Integrações.";
      } else {
        const event = await createGoogleCalendarEvent({
          accessToken: token,
          summary: `Consulta ${inPerson ? "presencial" : "online"} — ${patient.full_name}`,
          description: [
            `Paciente: ${patient.full_name}`,
            `Pagamento: ${paymentMethodLabel(payment.method)}`,
            inPerson ? `Endereço: ${location}` : null,
            mapsUrl ? `Como chegar: ${mapsUrl}` : null
          ]
            .filter(Boolean)
            .join("\n"),
          startIso: startsAt.toISOString(),
          endIso: endsAt.toISOString(),
          attendeeEmail: patientEmail,
          requestId: `appt-${appointment.id}-${randomUUID()}`,
          location,
          withMeet: !inPerson
        });
        meetLink = event.meetLink;
        googleEventId = event.googleEventId;
        await supabase
          .from("appointments")
          .update({ meet_link: meetLink, google_event_id: googleEventId })
          .eq("id", appointment.id);
      }
    } catch (err) {
      console.error("Google Calendar event failed:", err?.message || err);
      calendarWarning = "Consulta marcada, mas o evento no Google Agenda não pôde ser criado.";
    }
  } else {
    calendarWarning = "Consulta marcada. Google Agenda não configurado no servidor.";
  }

  let emailSent = false;
  if (patientEmail) {
    try {
      await sendEmail({
        to: patientEmail,
        ...appointmentScheduledEmail({
          fullName: patient.full_name,
          startsAt: startsAt.toISOString(),
          modality: body.modality,
          location,
          mapsUrl,
          siteUrl: getSiteUrl(request)
        })
      });
      emailSent = true;
    } catch (err) {
      console.error("Appointment email failed:", err?.message || err);
    }
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "appointment_create_by_nutritionist",
    resourceType: "appointment",
    resourceId: appointment.id,
    ip: getClientIp(request)
  });

  const saved = { ...appointment, meet_link: meetLink, google_event_id: googleEventId };
  return NextResponse.json({
    appointment: saved,
    calendarWarning,
    emailSent,
    hasAccount: Boolean(patient.user_id),
    usedPackage: usedPackage ? { name: usedPackage.name } : null,
    whatsappHref: appointmentWhatsappLink({ phone: patient.phone, fullName: patient.full_name, appointment: saved })
  });
}
