import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { generateSlotsFromRules, appointmentEnd } from "@/lib/scheduling/slots";
import {
  CONSULTATION_BUFFER_MIN,
  CONSULTATION_DURATION_MIN
} from "@/lib/constants";
import { getGoogleAccessToken, fetchGoogleFreeBusy } from "@/lib/google/calendar";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ message: "Parâmetros from e to obrigatórios." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const [{ data: rules }, { data: blocks }, { data: appointments }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("active", true),
    supabase
      .from("availability_blocks")
      .select("*")
      .gte("ends_at", from)
      .lte("starts_at", to),
    supabase
      .from("appointments")
      .select("starts_at, status")
      .gte("starts_at", from)
      .lte("starts_at", to)
  ]);

  let googleBusy = [];
  const { data: nutritionist } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "nutritionist")
    .limit(1)
    .maybeSingle();

  if (nutritionist?.id && process.env.GOOGLE_CLIENT_ID) {
    try {
      const token = await getGoogleAccessToken(nutritionist.id);
      if (token) {
        googleBusy = await fetchGoogleFreeBusy(token, from, to);
      }
    } catch {
      googleBusy = [];
    }
  }

  const slots = generateSlotsFromRules({
    from: fromDate,
    to: toDate,
    rules: rules || [],
    appointments: appointments || [],
    blocks: blocks || [],
    googleBusy
  });

  return NextResponse.json({ slots, durationMin: CONSULTATION_DURATION_MIN, bufferMin: CONSULTATION_BUFFER_MIN });
}
