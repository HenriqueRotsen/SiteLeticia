import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { syncMeetNotes } from "@/lib/google/meet-notes-sync";

/** Botão "Buscar atas do Meet": mesma rotina do cron, disparada pela nutricionista. */
export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { httpStatus, body } = await syncMeetNotes({
    supabase: createSupabaseAdmin(),
    nutritionistId: auth.ctx.user.id
  });

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "meet_notes_sync",
    resourceType: "clinical_record",
    resourceId: null,
    ip: getClientIp(request)
  });

  return NextResponse.json(body, { status: httpStatus });
}
