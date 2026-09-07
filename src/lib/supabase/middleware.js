import { NextResponse } from "next/server";
import { isDemoMode, DEMO_ROLE_COOKIE } from "@/lib/demo/config";
import { handleDemoApi } from "@/lib/demo/api";

export async function updateSession(request) {
  if (isDemoMode()) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/api/")) {
      if (pathname.startsWith("/api/demo/")) {
        return NextResponse.next({ request });
      }
      return handleDemoApi(request);
    }

    const role = request.cookies.get(DEMO_ROLE_COOKIE)?.value;

    if ((pathname.startsWith("/app") || pathname.startsWith("/admin")) && !role) {
      const url = request.nextUrl.clone();
      url.pathname = "/demo";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin") && role !== "nutritionist") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  const { updateSession: supabaseUpdateSession } = await import("@/lib/supabase/middleware-supabase");
  return supabaseUpdateSession(request);
}
