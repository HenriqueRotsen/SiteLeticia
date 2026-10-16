import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptText } from "@/lib/crypto";
import { exchangeGoogleCode } from "@/lib/google/calendar";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectBase = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/configuracoes/integracoes`;

  if (error || !code || !state) {
    return NextResponse.redirect(`${redirectBase}?error=oauth`);
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${redirectBase}?error=no_refresh`);
    }

    const supabase = createSupabaseAdmin();
    await supabase.from("google_calendar_connections").upsert(
      {
        nutritionist_id: state,
        calendar_id: "primary",
        refresh_token_encrypted: encryptText(tokens.refresh_token),
        connected_at: new Date().toISOString()
      },
      { onConflict: "nutritionist_id" }
    );

    return NextResponse.redirect(`${redirectBase}?connected=1`);
  } catch {
    return NextResponse.redirect(`${redirectBase}?error=exchange`);
  }
}
