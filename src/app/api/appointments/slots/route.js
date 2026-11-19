import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { computeAvailableSlots, parseSlotRange } from "@/lib/scheduling/available-slots";
import {
  CONSULTATION_BUFFER_MIN,
  CONSULTATION_DURATION_MIN
} from "@/lib/constants";
import { isBookingEnabled } from "@/lib/scheduling/booking-status";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ message: "Parâmetros from e to obrigatórios." }, { status: 400 });
  }

  const bookingEnabled = await isBookingEnabled();
  if (!bookingEnabled) {
    return NextResponse.json({
      slots: [],
      bookingEnabled: false,
      durationMin: CONSULTATION_DURATION_MIN,
      bufferMin: CONSULTATION_BUFFER_MIN,
      message: "A marcação de consultas está temporariamente desativada."
    });
  }

  const range = parseSlotRange(from, to);
  if (!range) {
    return NextResponse.json({ message: "Intervalo inválido." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { slots } = await computeAvailableSlots(supabase, range);

  return NextResponse.json({
    slots,
    bookingEnabled: true,
    durationMin: CONSULTATION_DURATION_MIN,
    bufferMin: CONSULTATION_BUFFER_MIN
  });
}
