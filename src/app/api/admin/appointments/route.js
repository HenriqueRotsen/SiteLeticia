import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";

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
