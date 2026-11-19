// Horários livres num intervalo: regras semanais − bloqueios − consultas − Google Agenda.

import { generateSlotsFromRules } from "@/lib/scheduling/slots";
import { getGoogleAccessToken, fetchGoogleFreeBusy } from "@/lib/google/calendar";
import { BOOKING_HORIZON_DAYS } from "@/lib/scheduling/month";

const MAX_RANGE_MS = (BOOKING_HORIZON_DAYS + 31) * 86_400_000;

/** Valida from/to e limita o intervalo (evita pedidos enormes na rota pública). */
export function parseSlotRange(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || toDate < fromDate) return null;
  if (toDate.getTime() - fromDate.getTime() > MAX_RANGE_MS) {
    return { fromDate, toDate: new Date(fromDate.getTime() + MAX_RANGE_MS) };
  }
  return { fromDate, toDate };
}

export async function computeAvailableSlots(supabase, { fromDate, toDate, now = new Date() }) {
  const from = fromDate.toISOString();
  const to = toDate.toISOString();

  const [{ data: rules }, { data: blocks }, { data: appointments }] = await Promise.all([
    supabase.from("availability_rules").select("*").eq("active", true),
    supabase.from("availability_blocks").select("*").gte("ends_at", from).lte("starts_at", to),
    supabase.from("appointments").select("starts_at, status").gte("starts_at", from).lte("starts_at", to)
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
      if (token) googleBusy = await fetchGoogleFreeBusy(token, from, to);
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

  // Nunca oferece horário que já passou.
  return { slots: slots.filter((slot) => new Date(slot.startsAt) > now), blocks: blocks || [] };
}
