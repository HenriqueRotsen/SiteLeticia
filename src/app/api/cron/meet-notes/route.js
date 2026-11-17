import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { syncMeetNotes } from "@/lib/google/meet-notes-sync";

/**
 * Experimental: importa a ata do Google Meet (anexo do evento no Google Agenda)
 * como rascunho no prontuário da consulta. Chamado pelo GitHub Actions
 * (.github/workflows/meet-notes.yml). Só roda com GOOGLE_MEET_NOTES_ENABLED=true.
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

  const { data: nutritionist } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "nutritionist")
    .limit(1)
    .maybeSingle();

  if (!nutritionist) {
    return NextResponse.json({ ok: true, skipped: "Nenhuma nutricionista cadastrada." });
  }

  const { httpStatus, body } = await syncMeetNotes({ supabase, nutritionistId: nutritionist.id });
  return NextResponse.json(body, { status: httpStatus });
}
