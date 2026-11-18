import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export function getPhotosBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_PHOTOS || "progress-photos";
}

// Apaga a foto de evolução (registro + arquivo) do paciente informado.
export async function deleteProgressPhoto(patientId, photoId) {
  const supabase = createSupabaseAdmin();
  const { data: photo } = await supabase
    .from("progress_photos")
    .select("id, storage_path")
    .eq("id", photoId)
    .eq("patient_id", patientId)
    .maybeSingle();
  if (!photo) return { error: "Foto não encontrada.", status: 404 };

  const { error } = await supabase.from("progress_photos").delete().eq("id", photo.id);
  if (error) return { error: "Não foi possível excluir a foto.", status: 500 };

  if (photo.storage_path) {
    try {
      await supabase.storage.from(getPhotosBucket()).remove([photo.storage_path]);
    } catch (err) {
      console.error("Photo storage remove failed:", err?.message || err);
    }
  }
  return { error: null };
}
