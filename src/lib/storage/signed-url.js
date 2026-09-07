import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function createStorageSignedUrl(bucket, path) {
  if (!bucket || !path) return null;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}

export async function attachPhotoUrls(photos) {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET_PHOTOS || "progress-photos";

  return Promise.all(
    (photos || []).map(async (photo) => ({
      ...photo,
      url: await createStorageSignedUrl(bucket, photo.storage_path)
    }))
  );
}
