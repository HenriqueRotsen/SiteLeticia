import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export function photosBucket() {
  return process.env.SUPABASE_STORAGE_BUCKET_PHOTOS || "progress-photos";
}

export async function createStorageSignedUrl(bucket, path, ttlSeconds = SIGNED_URL_TTL_SECONDS) {
  if (!bucket || !path) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);

  if (error) return null;
  return data.signedUrl;
}

export async function attachPhotoUrls(photos, { ttlSeconds = SIGNED_URL_TTL_SECONDS } = {}) {
  const bucket = photosBucket();

  return Promise.all(
    (photos || []).map(async (photo) => ({
      ...photo,
      url: await createStorageSignedUrl(bucket, photo.storage_path, ttlSeconds)
    }))
  );
}
