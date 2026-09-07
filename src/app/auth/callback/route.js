import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") || "/app";
  const siteUrl = getSiteUrl(request);

  if (requestUrl.searchParams.get("error")) {
    const url = new URL("/recuperar-senha", siteUrl);
    url.searchParams.set("error", "link_invalido");
    return NextResponse.redirect(url);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback failed:", error.message);
      const url = new URL("/recuperar-senha", siteUrl);
      url.searchParams.set("error", "link_expirado");
      return NextResponse.redirect(url);
    }
  }

  const safeNext = nextPath.startsWith("/") ? nextPath : "/app";
  return NextResponse.redirect(new URL(safeNext, siteUrl));
}
