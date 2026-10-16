import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import {
  MFA_OK_COOKIE,
  MFA_PENDING_COOKIE,
  mfaCookieOptions,
  signMfaOk
} from "@/lib/auth/mfa-cookies";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/session-cookies";

const ALLOWED_TYPES = new Set(["recovery", "signup", "invite", "magiclink", "email"]);

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const siteUrl = getSiteUrl(request);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") || "recovery";
  const nextPath = requestUrl.searchParams.get("next") || "/redefinir-senha";

  if (!tokenHash || !ALLOWED_TYPES.has(type)) {
    const url = new URL("/recuperar-senha", siteUrl);
    url.searchParams.set("error", "link_invalido");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash
  });

  if (error) {
    console.error("Auth confirm failed:", error.message);
    const url = new URL("/recuperar-senha", siteUrl);
    url.searchParams.set("error", "link_expirado");
    return NextResponse.redirect(url);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/redefinir-senha";

  const response = NextResponse.redirect(new URL(safeNext, siteUrl));

  if (user?.id && (type === "recovery" || safeNext.startsWith("/redefinir-senha"))) {
    response.cookies.set(
      MFA_OK_COOKIE,
      await signMfaOk(user.id),
      mfaCookieOptions(SESSION_MAX_AGE_SECONDS)
    );
    response.cookies.set(MFA_PENDING_COOKIE, "", { ...mfaCookieOptions(0), maxAge: 0 });
  }

  return response;
}
