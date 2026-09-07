import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [{ count: patientsCount }, { count: todayCount }, { count: pendingLabsCount }, { data: upcoming }] =
    await Promise.all([
      auth.ctx.supabase.from("patients").select("*", { count: "exact", head: true }),
      auth.ctx.supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .gte("starts_at", todayStart.toISOString())
        .lte("starts_at", todayEnd.toISOString())
        .eq("status", "scheduled"),
      auth.ctx.supabase
        .from("lab_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft"),
      auth.ctx.supabase
        .from("appointments")
        .select("*, patients(full_name, phone)")
        .gte("starts_at", new Date().toISOString())
        .eq("status", "scheduled")
        .order("starts_at", { ascending: true })
        .limit(10)
    ]);

  return NextResponse.json({
    stats: {
      patients: patientsCount || 0,
      appointmentsToday: todayCount || 0,
      pendingLabs: pendingLabsCount || 0
    },
    upcoming: upcoming || []
  });
}
