import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { deleteGoogleCalendarEvent, getGoogleAccessToken } from "@/lib/google/calendar";

export async function cancelAppointmentRecord(appointment) {
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    .eq("id", appointment.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Não foi possível cancelar.");
  }

  if (appointment.google_event_id && process.env.GOOGLE_CLIENT_ID) {
    try {
      const { data: nutritionist } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "nutritionist")
        .limit(1)
        .maybeSingle();

      if (nutritionist?.id) {
        const token = await getGoogleAccessToken(nutritionist.id);
        if (token) {
          await deleteGoogleCalendarEvent(token, appointment.google_event_id);
        }
      }
    } catch (err) {
      console.error("Failed to delete Google Calendar event:", err?.message || err);
    }
  }

  return data;
}
