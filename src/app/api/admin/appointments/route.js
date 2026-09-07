import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("appointments")
    .select("*, patients(full_name, phone)")
    .order("starts_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ appointments: data || [] });
}
