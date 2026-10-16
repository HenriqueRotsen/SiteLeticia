import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

/** Retorna se pacientes podem marcar novas consultas. Default: true. */
export async function isBookingEnabled() {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("payment_settings")
      .select("booking_enabled")
      .limit(1)
      .maybeSingle();

    if (error) {
      // Coluna ainda não migrada → mantém aberto
      return true;
    }

    return data?.booking_enabled !== false;
  } catch {
    return true;
  }
}
