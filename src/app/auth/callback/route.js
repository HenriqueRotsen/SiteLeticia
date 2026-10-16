import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";

async function resolvePostAuthPath(supabase, requestedNext) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let role = "patient";
  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role === "nutritionist") role = "nutritionist";
  }

  const home = role === "nutritionist" ? "/admin" : "/app";
  if (!requestedNext || !requestedNext.startsWith("/")) return home;

  if (role === "nutritionist" && requestedNext.startsWith("/app")) return "/admin";
  if (role !== "nutritionist" && requestedNext.startsWith("/admin")) return "/app";
  return requestedNext;
}

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

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback failed:", error.message);
      const url = new URL("/recuperar-senha", siteUrl);
      url.searchParams.set("error", "link_expirado");
      return NextResponse.redirect(url);
    }
  }

  const safeNext = await resolvePostAuthPath(supabase, nextPath);
  return NextResponse.redirect(new URL(safeNext, siteUrl));
}
