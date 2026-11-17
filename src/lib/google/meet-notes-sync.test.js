import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseAdmin", () => ({ createSupabaseAdmin: () => ({}) }));

const { syncMeetNotes, describeSyncResult } = await import("./meet-notes-sync");
const { GoogleReconnectError } = await import("./calendar");
const { GoogleScopeError } = await import("./meet-notes");

describe("syncMeetNotes", () => {
  beforeEach(() => vi.stubEnv("GOOGLE_MEET_NOTES_ENABLED", "true"));
  afterEach(() => vi.unstubAllEnvs());

  it("não faz nada com o recurso desligado", async () => {
    vi.stubEnv("GOOGLE_MEET_NOTES_ENABLED", "false");
    const runImport = vi.fn();
    const { body } = await syncMeetNotes({ supabase: {}, nutritionistId: "n1", deps: { runImport } });
    expect(body.skipped).toBe("disabled");
    expect(runImport).not.toHaveBeenCalled();
  });

  it("pede reconexão quando o token salvo não serve", async () => {
    const getToken = vi.fn().mockRejectedValue(new GoogleReconnectError("x"));
    const { httpStatus, body } = await syncMeetNotes({ supabase: {}, nutritionistId: "n1", deps: { getToken } });
    expect(httpStatus).toBe(200);
    expect(body).toMatchObject({ ok: false, needsReconnect: true });
  });

  it("pede reconexão quando falta o escopo do Docs", async () => {
    const { body } = await syncMeetNotes({
      supabase: {},
      nutritionistId: "n1",
      deps: {
        getToken: async () => "tok",
        runImport: async () => {
          throw new GoogleScopeError("sem escopo");
        }
      }
    });
    expect(body).toMatchObject({ needsReconnect: true });
    expect(body.message).toMatch(/Google Docs/);
  });

  it("devolve o resultado da importação", async () => {
    const runImport = vi.fn().mockResolvedValue({ checked: 2, imported: 1, pending: 1, failures: [] });
    const { body } = await syncMeetNotes({
      supabase: { tag: "db" },
      nutritionistId: "n1",
      deps: { getToken: async () => "tok", runImport }
    });
    expect(runImport).toHaveBeenCalledWith({ supabase: { tag: "db" }, accessToken: "tok" });
    expect(body).toEqual({ ok: true, checked: 2, imported: 1, pending: 1, failures: [] });
  });
});

describe("describeSyncResult", () => {
  it("resume importadas e pendentes", () => {
    expect(describeSyncResult({ imported: 1, pending: 2, failures: [] })).toBe(
      "1 ata importada como rascunho. 2 consultas encerradas ainda sem ata no Google Agenda."
    );
    expect(describeSyncResult({ imported: 0, pending: 0, failures: [] })).toBe("Nenhuma ata nova encontrada.");
  });

  it("mostra a mensagem do servidor quando houver", () => {
    expect(describeSyncResult({ needsReconnect: true, message: "Reconecte" })).toBe("Reconecte");
  });
});
