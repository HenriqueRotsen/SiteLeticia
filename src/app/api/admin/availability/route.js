import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { availabilityRuleSchema, availabilityBlockSchema } from "@/lib/validation/schemas";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const [{ data: rules }, { data: blocks }] = await Promise.all([
    auth.ctx.supabase.from("availability_rules").select("*").order("weekday"),
    auth.ctx.supabase.from("availability_blocks").select("*").order("starts_at", { ascending: false })
  ]);

  return NextResponse.json({ rules: rules || [], blocks: blocks || [] });
}

export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (body.kind === "block") {
    try {
      const parsed = availabilityBlockSchema.parse(body);
      const { data, error } = await auth.ctx.supabase
        .from("availability_blocks")
        .insert({
          starts_at: parsed.startsAt,
          ends_at: parsed.endsAt,
          reason: parsed.reason || null
        })
        .select("*")
        .single();
      if (error) throw error;
      return NextResponse.json({ block: data });
    } catch {
      return NextResponse.json({ message: "Bloqueio inválido." }, { status: 400 });
    }
  }

  try {
    const parsed = availabilityRuleSchema.parse(body);
    const { data, error } = await auth.ctx.supabase
      .from("availability_rules")
      .insert({
        weekday: parsed.weekday,
        start_time: parsed.startTime,
        end_time: parsed.endTime,
        active: parsed.active
      })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ rule: data });
  } catch {
    return NextResponse.json({ message: "Regra inválida." }, { status: 400 });
  }
}

export async function DELETE(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });

  const table = kind === "block" ? "availability_blocks" : "availability_rules";
  await auth.ctx.supabase.from(table).delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
