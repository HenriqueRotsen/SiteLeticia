function isLocalhostUrl(value) {
  if (!value) return false;
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function normalizeSiteUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function siteUrlFromRequest(request) {
  if (!request?.headers) return null;

  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!hostHeader) return null;

  const host = hostHeader.split(",")[0]?.trim();
  if (!host || /^localhost(:\d+)?$/i.test(host) || /^127\.0\.0\.1(:\d+)?$/.test(host)) {
    return null;
  }

  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto = protoHeader?.split(",")[0]?.trim() || (host.includes("localhost") ? "http" : "https");

  return `${proto}://${host}`;
}

export function getSiteUrl(request) {
  const configured = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const fromRequest = siteUrlFromRequest(request);
  const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

  if (fromRequest) {
    return fromRequest;
  }

  if (configured && (!isProduction || !isLocalhostUrl(configured))) {
    return configured;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (configured) {
    return configured;
  }

  return "http://localhost:3000";
}

export function buildAuthCallbackUrl(request, nextPath) {
  const siteUrl = getSiteUrl(request);
  const next = encodeURIComponent(nextPath);
  return `${siteUrl}/auth/callback?next=${next}`;
}
