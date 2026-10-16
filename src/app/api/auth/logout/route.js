import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MFA_OK_COOKIE, MFA_PENDING_COOKIE, mfaCookieOptions } from "@/lib/auth/mfa-cookies";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(MFA_OK_COOKIE, "", { ...mfaCookieOptions(0), maxAge: 0 });
  response.cookies.set(MFA_PENDING_COOKIE, "", { ...mfaCookieOptions(0), maxAge: 0 });
  return response;
}
