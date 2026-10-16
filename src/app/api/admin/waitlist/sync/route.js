import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { syncAllWaitlistToPatients } from "@/lib/waitlist/position";

export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Supabase admin não configurado no servidor." },
      { status: 500 }
    );
  }

  try {
    const result = await syncAllWaitlistToPatients(supabase);

    await writeAuditLog({
      actorId: auth.ctx.user.id,
      action: "waitlist_sync_patients",
      resourceType: "waitlist",
      resourceId: null,
      ip: getClientIp(request)
    });

    return NextResponse.json({
      ok: true,
      ...result,
      message:
        result.failed > 0
          ? `Sincronização parcial: ${result.created} criados, ${result.linked} vinculados, ${result.failed} falha(s).`
          : `Fila sincronizada: ${result.waitlistTotal} na waitlist → ${result.patientsFromWaitlist} pacientes.`
    });
  } catch (error) {
    console.error("Waitlist sync failed:", error);
    return NextResponse.json(
      { message: error.message || "Não foi possível sincronizar a fila." },
      { status: 500 }
    );
  }
}
