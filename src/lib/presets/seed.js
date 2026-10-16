import seedData from "@/lib/presets/seed-data.json";

export const PRESET_TYPES = ["supplement_pack", "exam_order", "referral_letter"];

export function getSeedPresets(type = null) {
  const rows = Array.isArray(seedData) ? seedData : [];
  if (!type) return rows;
  return rows.filter((row) => row.type === type);
}

/**
 * Garante que os presets seed existam no banco (upsert por type+slug).
 * Sem force, só preenche se a tabela estiver vazia.
 */
export async function ensurePresetsSeeded(supabase, { force = false } = {}) {
  const { count, error: countError } = await supabase
    .from("prescription_presets")
    .select("*", { count: "exact", head: true });

  if (countError) throw countError;

  if (!force && (count || 0) > 0) {
    return { seeded: false, count: count || 0 };
  }

  const rows = getSeedPresets().map((preset, index) => ({
    type: preset.type,
    title: preset.title,
    slug: preset.slug,
    content: preset.content || {},
    sort_order: preset.sortOrder ?? index,
    active: true,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase.from("prescription_presets").upsert(rows, {
    onConflict: "type,slug"
  });

  if (error) throw error;

  return { seeded: true, count: rows.length };
}

export function mapPresetRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    content: row.content || {},
    sortOrder: row.sort_order ?? 0,
    active: row.active !== false,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/** Fallback quando o banco ainda não tem a tabela — sempre disponível no app. */
export function getSeedPresetsAsRows(type = null) {
  return getSeedPresets(type).map((preset, index) => ({
    id: `seed-${preset.slug}`,
    type: preset.type,
    title: preset.title,
    slug: preset.slug,
    content: preset.content || {},
    sortOrder: preset.sortOrder ?? index,
    active: true,
    createdAt: null,
    updatedAt: null
  }));
}
