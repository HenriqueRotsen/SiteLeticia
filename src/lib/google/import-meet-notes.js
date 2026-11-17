import {
  GoogleScopeError,
  MEET_NOTES_SOURCE,
  buildDraftRecord,
  fetchCalendarEvent,
  fetchGoogleDoc,
  googleDocToPlainText,
  pickNotesAttachment
} from "@/lib/google/meet-notes";

const MINUTE = 60 * 1000;
// A ata do Gemini costuma chegar alguns minutos depois do fim da reunião.
export const MEET_NOTES_MIN_DELAY_MS = 15 * MINUTE;
// Depois disso a rotina para de procurar (consultas sem ata não ficam em loop para sempre).
export const MEET_NOTES_GIVE_UP_MS = 3 * 24 * 60 * MINUTE;

/**
 * Procura a ata das consultas encerradas e salva como rascunho no prontuário.
 * Dependências injetáveis para teste.
 */
export async function importMeetNotes({
  supabase,
  accessToken,
  now = new Date(),
  calendarId = "primary",
  getEvent = fetchCalendarEvent,
  getDoc = fetchGoogleDoc
}) {
  const nowMs = now.getTime();
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("id, patient_id, starts_at, ends_at, status, google_event_id")
    .in("status", ["scheduled", "completed"])
    .not("google_event_id", "is", null)
    .is("meet_notes_imported_at", null)
    .gte("ends_at", new Date(nowMs - MEET_NOTES_GIVE_UP_MS).toISOString())
    .lte("ends_at", new Date(nowMs - MEET_NOTES_MIN_DELAY_MS).toISOString())
    .order("ends_at", { ascending: true })
    .limit(20);

  if (error) throw new Error(`Não foi possível ler as consultas: ${error.message}`);

  const result = { checked: 0, imported: 0, pending: 0, failures: [] };

  for (const appt of appointments || []) {
    result.checked += 1;
    try {
      const event = await getEvent(accessToken, appt.google_event_id, calendarId);
      const attachment = pickNotesAttachment(event?.attachments);
      if (!attachment) {
        result.pending += 1;
        continue;
      }

      const doc = await getDoc(accessToken, attachment.documentId);
      const text = doc ? googleDocToPlainText(doc) : "";
      if (!text) {
        result.pending += 1;
        continue;
      }

      const { error: insertError } = await supabase
        .from("clinical_records")
        .insert(buildDraftRecord({ appointment: appt, attachment, text }));

      // 23505: já existe rascunho importado para esta consulta.
      if (insertError && insertError.code !== "23505") {
        result.failures.push(`${appt.id}: ${insertError.message}`);
        continue;
      }

      await supabase
        .from("appointments")
        .update({ meet_notes_imported_at: new Date(nowMs).toISOString() })
        .eq("id", appt.id);
      if (!insertError) result.imported += 1;
    } catch (err) {
      // Falta de escopo vale para todas as consultas: para logo e avisa.
      if (err instanceof GoogleScopeError) throw err;
      result.failures.push(`${appt.id}: ${err?.message || err}`);
    }
  }

  return result;
}

export { MEET_NOTES_SOURCE };
