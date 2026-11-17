import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let connectionRow = null;

vi.mock("@/lib/supabaseAdmin", () => ({
  createSupabaseAdmin: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: connectionRow }) })
      })
    })
  })
}));

const { checkGoogleConnection } = await import("@/lib/google/calendar");
const { encryptText } = await import("@/lib/crypto");

describe("checkGoogleConnection", () => {
  beforeEach(() => {
    vi.stubEnv("TOKEN_ENCRYPTION_SECRET", "segredo-atual");
    connectionRow = null;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reports not_connected when there is no saved connection", async () => {
    expect(await checkGoogleConnection("n1")).toEqual({ status: "not_connected" });
  });

  it("asks to reconnect when the token was encrypted with another secret", async () => {
    vi.stubEnv("TOKEN_ENCRYPTION_SECRET", "segredo-antigo");
    connectionRow = { refresh_token_encrypted: encryptText("refresh-token") };
    vi.stubEnv("TOKEN_ENCRYPTION_SECRET", "segredo-atual");

    const result = await checkGoogleConnection("n1");
    expect(result.status).toBe("needs_reconnect");
  });

  it("asks to reconnect when Google answers invalid_grant", async () => {
    connectionRow = { refresh_token_encrypted: encryptText("refresh-token") };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 }))
    );

    const result = await checkGoogleConnection("n1");
    expect(result.status).toBe("needs_reconnect");
  });

  it("reports ok when the token refreshes", async () => {
    connectionRow = { refresh_token_encrypted: encryptText("refresh-token") };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ access_token: "abc" }), { status: 200 }))
    );

    expect(await checkGoogleConnection("n1")).toEqual({ status: "ok" });
  });
});
