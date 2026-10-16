import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  ensurePresetsSeeded,
  getSeedPresetsAsRows,
  mapPresetRow,
  PRESET_TYPES
} from "@/lib/presets/seed";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const activeAll = url.searchParams.get("active") === "all";

  function filterSeed() {
    let presets = getSeedPresetsAsRows(type && PRESET_TYPES.includes(type) ? type : null);
    if (!activeAll) presets = presets.filter((item) => item.active !== false);
    return presets;
  }

  try {
    const supabase = createSupabaseAdmin();
    await ensurePresetsSeeded(supabase, {
      force: url.searchParams.get("resync") === "1"
    });

    let query = supabase
      .from("prescription_presets")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (type && PRESET_TYPES.includes(type)) {
      query = query.eq("type", type);
    }

    if (!activeAll) {
      query = query.eq("active", true);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({
        presets: filterSeed(),
        source: "seed",
        message: "Usando modelos embutidos (execute migrate-prescription-presets.sql para persistir)."
      });
    }

    return NextResponse.json({ presets: (data || []).map(mapPresetRow), source: "database" });
  } catch (error) {
    console.error("Preset list fallback to seed:", error);
    return NextResponse.json({
      presets: filterSeed(),
      source: "seed",
      message: "Usando modelos embutidos (execute migrate-prescription-presets.sql para persistir)."
    });
  }
}

export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  if (!PRESET_TYPES.includes(body.type)) {
    return NextResponse.json({ message: "Tipo de preset inválido." }, { status: 400 });
  }
  if (!String(body.title || "").trim()) {
    return NextResponse.json({ message: "Título obrigatório." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const slugBase = String(body.slug || body.title)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  const { data, error } = await supabase
    .from("prescription_presets")
    .insert({
      type: body.type,
      title: String(body.title).trim(),
      slug: slugBase || `preset-${Date.now()}`,
      content: body.content || {},
      sort_order: Number(body.sortOrder) || 0,
      active: body.active !== false,
      updated_at: new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ message: error.message || "Erro ao criar preset." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "preset_create",
    resourceType: "prescription_preset",
    resourceId: data.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ preset: mapPresetRow(data) });
}
