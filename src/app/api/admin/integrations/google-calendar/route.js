import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { checkGoogleConnection } from "@/lib/google/calendar";

export async function DELETE() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  await auth.ctx.supabase
    .from("google_calendar_connections")
    .delete()
    .eq("nutritionist_id", auth.ctx.user.id);

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("google_calendar_connections")
    .select("connected_at, calendar_id")
    .eq("nutritionist_id", auth.ctx.user.id)
    .maybeSingle();

  const health = data ? await checkGoogleConnection(auth.ctx.user.id) : { status: "not_connected" };

  return NextResponse.json({ connected: Boolean(data), connection: data, health });
}
