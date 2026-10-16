import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const [{ data: settings }, { data: methods }] = await Promise.all([
    supabase.from("payment_settings").select("*").limit(1).maybeSingle(),
    supabase.from("payment_methods").select("id, type, label, details, sort_order").eq("active", true).order("sort_order")
  ]);

  return NextResponse.json({
    settings: settings || { consultation_price_cents: 0, currency: "BRL" },
    methods: methods || []
  });
}
