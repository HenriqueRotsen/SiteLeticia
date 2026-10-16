import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { MFA_OK_COOKIE, MFA_PENDING_COOKIE, verifyMfaOk } from "@/lib/auth/mfa-cookies";

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const requireMfa = process.env.AUTH_EMAIL_MFA !== "false";
  const mfaOk = await verifyMfaOk(request.cookies.get(MFA_OK_COOKIE)?.value, user?.id);
  const mfaPending = request.cookies.get(MFA_PENDING_COOKIE)?.value;

  if (
    requireMfa &&
    user &&
    mfaPending === user.id &&
    !mfaOk &&
    !pathname.startsWith("/verificar-codigo") &&
    !pathname.startsWith("/api/auth/mfa") &&
    !pathname.startsWith("/api/auth/logout") &&
    (pathname.startsWith("/app") || pathname.startsWith("/admin") || pathname === "/entrar")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/verificar-codigo";
    if (pathname.startsWith("/app") || pathname.startsWith("/admin")) {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  if ((pathname.startsWith("/app") || pathname.startsWith("/admin")) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (
    requireMfa &&
    user &&
    !mfaOk &&
    (pathname.startsWith("/app") || pathname.startsWith("/admin"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/verificar-codigo";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname.startsWith("/app") || pathname.startsWith("/admin"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = profile?.role || "patient";

    if (pathname.startsWith("/admin") && role !== "nutritionist") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/app") && role === "nutritionist") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
