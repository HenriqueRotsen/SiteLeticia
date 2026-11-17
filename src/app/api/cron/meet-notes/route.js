import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GoogleReconnectError, getGoogleAccessToken } from "@/lib/google/calendar";
import { GoogleScopeError, isMeetNotesEnabled } from "@/lib/google/meet-notes";
import { importMeetNotes } from "@/lib/google/import-meet-notes";

/**
 * Experimental: importa a ata do Google Meet (anexo do evento no Google Agenda)
 * como rascunho no prontuário da consulta. Chame a cada 30 minutos
 * (ver docs/meet-notes.workflow.yml). Só roda com GOOGLE_MEET_NOTES_ENABLED=true.
 */
export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ message: "CRON_SECRET não configurada." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!isMeetNotesEnabled()) {
    return NextResponse.json({ ok: true, skipped: "GOOGLE_MEET_NOTES_ENABLED desligada." });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json({ message: "Supabase admin não configurado." }, { status: 500 });
  }

  const { data: nutritionist } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "nutritionist")
    .limit(1)
    .maybeSingle();

  if (!nutritionist) {
    return NextResponse.json({ ok: true, skipped: "Nenhuma nutricionista cadastrada." });
  }

  let accessToken;
  try {
    accessToken = await getGoogleAccessToken(nutritionist.id);
  } catch (err) {
    if (err instanceof GoogleReconnectError) {
      return NextResponse.json({ ok: false, needsReconnect: true, message: err.message });
    }
    return NextResponse.json({ message: "Falha ao obter acesso ao Google." }, { status: 502 });
  }

  if (!accessToken) {
    return NextResponse.json({ ok: true, skipped: "Google não conectado." });
  }

  try {
    const result = await importMeetNotes({ supabase, accessToken });
    return NextResponse.json({ ok: result.failures.length === 0, ...result });
  } catch (err) {
    if (err instanceof GoogleScopeError) {
      return NextResponse.json({
        ok: false,
        needsReconnect: true,
        message:
          "O Google não autorizou a leitura da ata. Reconecte o Google em Integrações para conceder o acesso aos documentos."
      });
    }
    console.error("Meet notes import failed:", err);
    return NextResponse.json({ message: err?.message || "Falha ao importar atas." }, { status: 500 });
  }
}
