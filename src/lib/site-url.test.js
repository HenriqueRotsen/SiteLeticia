import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { buildAuthCallbackUrl, getSiteUrl } from "./site-url.js";

function mockRequest(headers = {}) {
  return {
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null;
      }
    }
  };
}

describe("getSiteUrl", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.VERCEL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("prefers forwarded host over localhost env in production", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

    const url = getSiteUrl(
      mockRequest({
        "x-forwarded-host": "app.leticia.com.br",
        "x-forwarded-proto": "https"
      })
    );

    expect(url).toBe("https://app.leticia.com.br");
  });

  it("uses configured public URL when not localhost", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.leticia.com.br/";

    const url = getSiteUrl();

    expect(url).toBe("https://app.leticia.com.br");
  });

  it("falls back to VERCEL_URL when configured URL is localhost in production", () => {
    process.env.NODE_ENV = "production";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.VERCEL = "1";
    process.env.VERCEL_URL = "fila-espera.vercel.app";

    const url = getSiteUrl();

    expect(url).toBe("https://fila-espera.vercel.app");
  });

  it("builds auth callback with encoded next path", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://app.leticia.com.br";

    const callback = buildAuthCallbackUrl(null, "/redefinir-senha");

    expect(callback).toBe(
      "https://app.leticia.com.br/auth/callback?next=%2Fredefinir-senha"
    );
  });
});
