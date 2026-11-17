import { decryptText } from "@/lib/crypto";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { TIMEZONE } from "@/lib/constants";
import { meetNotesScopes } from "@/lib/google/meet-notes";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy"
];

// Escopos extras (ex.: leitura da ata do Meet) só entram quando o recurso está ligado.
export function googleOAuthScopes() {
  return [...CALENDAR_SCOPES, ...meetNotesScopes()].join(" ");
}

export function getGoogleAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: googleOAuthScopes(),
    access_type: "offline",
    prompt: "consent",
    state
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// Conexão salva que não serve mais: a Letícia precisa reconectar em Integrações.
export class GoogleReconnectError extends Error {
  constructor(message) {
    super(message);
    this.name = "GoogleReconnectError";
  }
}

async function refreshAccessToken(refreshToken) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    // invalid_grant: acesso revogado, senha trocada ou token expirado (app em modo de teste expira em 7 dias).
    if (data.error === "invalid_grant") {
      throw new GoogleReconnectError("O Google recusou o acesso salvo (revogado ou expirado).");
    }
    throw new Error(`Failed to refresh Google token: ${data.error || response.status}`);
  }
  const data = await response.json();
  return data.access_token;
}

export async function getGoogleAccessToken(nutritionistId) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("google_calendar_connections")
    .select("*")
    .eq("nutritionist_id", nutritionistId)
    .maybeSingle();

  if (!data?.refresh_token_encrypted) return null;

  let refreshToken;
  try {
    refreshToken = decryptText(data.refresh_token_encrypted);
  } catch {
    // Token cifrado com outro TOKEN_ENCRYPTION_SECRET (ex.: conectado em outro ambiente).
    throw new GoogleReconnectError(
      "O acesso salvo não pode ser lido com a chave de criptografia atual do servidor."
    );
  }
  return refreshAccessToken(refreshToken);
}

// Usado pela tela de Integrações para mostrar se a conexão ainda funciona.
export async function checkGoogleConnection(nutritionistId) {
  try {
    const token = await getGoogleAccessToken(nutritionistId);
    return token ? { status: "ok" } : { status: "not_connected" };
  } catch (error) {
    if (error instanceof GoogleReconnectError) {
      return { status: "needs_reconnect", reason: error.message };
    }
    return { status: "error", reason: "Não foi possível verificar a conexão com o Google agora." };
  }
}

export async function fetchGoogleFreeBusy(accessToken, timeMin, timeMax, calendarId = "primary") {
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: TIMEZONE,
      items: [{ id: calendarId }]
    })
  });

  if (!response.ok) return [];
  const data = await response.json();
  const busy = data.calendars?.[calendarId]?.busy || [];
  return busy.map((b) => ({ start: b.start, end: b.end }));
}

export async function createGoogleCalendarEvent({
  accessToken,
  calendarId = "primary",
  summary,
  description,
  startIso,
  endIso,
  attendeeEmail,
  requestId,
  location = null,
  withMeet = true
}) {
  // Consulta presencial: evento com endereço e sem Meet.
  if (!withMeet) {
    return createGoogleCalendarEventWithoutMeet({
      accessToken,
      calendarId,
      summary,
      description,
      startIso,
      endIso,
      attendeeEmail,
      location
    });
  }

  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("conferenceDataVersion", "1");
  url.searchParams.set("sendUpdates", "all");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startIso, timeZone: TIMEZONE },
      end: { dateTime: endIso, timeZone: TIMEZONE },
      attendees: attendeeEmail ? [{ email: attendeeEmail, responseStatus: "needsAction" }] : [],
      conferenceData: {
        createRequest: {
          requestId,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      },
      reminders: { useDefault: true }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    // Contas pessoais às vezes falham ao criar Meet; tenta evento simples.
    if (conferencePayloadFailed(err)) {
      return createGoogleCalendarEventWithoutMeet({
        accessToken,
        calendarId,
        summary,
        description,
        startIso,
        endIso,
        attendeeEmail,
        location
      });
    }
    throw new Error(`Google Calendar error: ${err}`);
  }

  const event = await response.json();
  const meetLink =
    event.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
    event.hangoutLink ||
    null;

  return { googleEventId: event.id, meetLink };
}

function conferencePayloadFailed(errorText) {
  const text = String(errorText || "").toLowerCase();
  return (
    text.includes("conference") ||
    text.includes("hangout") ||
    text.includes("meet") ||
    text.includes("invalidConference")
  );
}

async function createGoogleCalendarEventWithoutMeet({
  accessToken,
  calendarId = "primary",
  summary,
  description,
  startIso,
  endIso,
  attendeeEmail,
  location = null
}) {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  );
  url.searchParams.set("sendUpdates", "all");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary,
      description,
      start: { dateTime: startIso, timeZone: TIMEZONE },
      end: { dateTime: endIso, timeZone: TIMEZONE },
      ...(location ? { location } : {}),
      attendees: attendeeEmail ? [{ email: attendeeEmail, responseStatus: "needsAction" }] : [],
      reminders: { useDefault: true }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Calendar error: ${err}`);
  }

  const event = await response.json();
  return { googleEventId: event.id, meetLink: null };
}

export async function deleteGoogleCalendarEvent(accessToken, eventId, calendarId = "primary") {
  if (!eventId) return;
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
}

export async function exchangeGoogleCode(code) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) throw new Error("OAuth exchange failed");
  return response.json();
}
