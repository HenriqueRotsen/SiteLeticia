import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateGeminiContent } from "@/lib/ai/gemini";

describe("generateGeminiContent", () => {
  beforeEach(() => {
    vi.stubEnv("GEMINI_API_KEY", "chave-de-teste");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("fails fast with a clear message when the API key is rejected", async () => {
    const fetchMock = vi.fn(async () => new Response('{"error":{"code":401}}', { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateGeminiContent({ prompt: "oi" })).rejects.toThrow(/GEMINI_API_KEY/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("tries the next model when one is not found", async () => {
    const ok = { candidates: [{ content: { parts: [{ text: '{"ok":true}' }] } }] };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("not found", { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(ok), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateGeminiContent({ prompt: "oi" });
    expect(result.data).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
