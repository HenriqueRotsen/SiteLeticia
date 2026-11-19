import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { computeAvailableSlots, parseSlotRange } from "@/lib/scheduling/available-slots";

// Prévia da agenda para a Letícia: mostra os horários que vão abrir mesmo com a marcação desligada.
export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const range = parseSlotRange(searchParams.get("from"), searchParams.get("to"));
  if (!range) return NextResponse.json({ message: "Intervalo inválido." }, { status: 400 });

  const { slots, blocks } = await computeAvailableSlots(createSupabaseAdmin(), range);
  return NextResponse.json({ slots, blocks });
}
