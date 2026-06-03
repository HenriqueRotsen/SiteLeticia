import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (cronSecret && authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let supabase;

  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Supabase admin não configurado." },
      { status: 500 }
    );
  }

  const { error, count } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível tocar no Supabase." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    touchedAt: new Date().toISOString(),
    count
  });
}
