/** Duração da sessão persistente (cookies de auth + 2FA). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias
export const SESSION_TTL_MS = SESSION_MAX_AGE_SECONDS * 1000;

export const authCookieOptions = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE_SECONDS
};

/** Opções para @supabase/ssr (persistir refresh token entre visitas). */
export function getSupabaseCookieOptions() {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS
  };
}
