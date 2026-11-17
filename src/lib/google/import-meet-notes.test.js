import { describe, expect, it, vi } from "vitest";
import { importMeetNotes } from "./import-meet-notes";
import { GoogleScopeError } from "./meet-notes";

const DOC = "application/vnd.google-apps.document";

function fakeSupabase({ appointments, insertError = null }) {
  const inserted = [];
  const updated = [];
  const filters = [];
  const supabase = {
    from(table) {
      if (table === "clinical_records") {
        return {
          insert: async (row) => {
            inserted.push(row);
            return { error: insertError };
          }
        };
      }
      const chain = {
        select: () => chain,
        in: (...args) => (filters.push(["in", ...args]), chain),
        not: (...args) => (filters.push(["not", ...args]), chain),
        is: (...args) => (filters.push(["is", ...args]), chain),
        gte: (...args) => (filters.push(["gte", ...args]), chain),
        lte: (...args) => (filters.push(["lte", ...args]), chain),
        order: () => chain,
        limit: async () => ({ data: appointments, error: null }),
        update: (values) => ({
          eq: async (_col, id) => {
            updated.push({ id, values });
            return { error: null };
          }
        })
      };
      return chain;
    }
  };
  return { supabase, inserted, updated, filters };
}

const appt = {
  id: "a1",
  patient_id: "p1",
  starts_at: "2026-11-17T10:00:00.000Z",
  ends_at: "2026-11-17T11:00:00.000Z",
  status: "scheduled",
  google_event_id: "evt1"
};
const now = new Date("2026-11-17T12:00:00.000Z");
const docWithText = { body: { content: [{ paragraph: { elements: [{ textRun: { content: "Resumo\n" } }] } }] } };

describe("importMeetNotes", () => {
  it("salva a ata como rascunho e marca a consulta", async () => {
    const db = fakeSupabase({ appointments: [appt] });
    const getEvent = vi.fn().mockResolvedValue({
      attachments: [{ title: "Anotações do Gemini", mimeType: DOC, fileId: "n1" }]
    });
    const getDoc = vi.fn().mockResolvedValue(docWithText);

    const result = await importMeetNotes({ supabase: db.supabase, accessToken: "tok", now, getEvent, getDoc });

    expect(result).toMatchObject({ checked: 1, imported: 1, pending: 0, failures: [] });
    expect(getEvent).toHaveBeenCalledWith("tok", "evt1", "primary");
    expect(getDoc).toHaveBeenCalledWith("tok", "n1");
    expect(db.inserted[0]).toMatchObject({ appointment_id: "a1", status: "draft", source_ref: "n1" });
    expect(db.updated).toEqual([{ id: "a1", values: { meet_notes_imported_at: now.toISOString() } }]);
    expect(db.filters).toContainEqual(["lte", "ends_at", "2026-11-17T11:45:00.000Z"]);
  });

  it("botão manual: importa a ata de consulta que ainda não chegou ao horário de término", async () => {
    const future = { ...appt, starts_at: "2026-11-18T18:00:00.000Z", ends_at: "2026-11-18T19:00:00.000Z" };
    const db = fakeSupabase({ appointments: [future] });
    const result = await importMeetNotes({
      supabase: db.supabase,
      accessToken: "tok",
      now,
      includeUpcomingMs: 7 * 24 * 60 * 60 * 1000,
      getEvent: async () => ({ attachments: [{ title: "Anotações do Gemini", mimeType: DOC, fileId: "n1" }] }),
      getDoc: async () => docWithText
    });
    expect(result).toMatchObject({ imported: 1 });
    expect(db.filters).toContainEqual(["lte", "starts_at", "2026-11-24T12:00:00.000Z"]);
    expect(db.filters.some(([op, col]) => op === "lte" && col === "ends_at")).toBe(false);
  });

  it("consulta futura sem ata conta como aguardando, não como pendente", async () => {
    const future = { ...appt, starts_at: "2026-11-18T18:00:00.000Z", ends_at: "2026-11-18T19:00:00.000Z" };
    const db = fakeSupabase({ appointments: [future] });
    const result = await importMeetNotes({
      supabase: db.supabase,
      accessToken: "tok",
      now,
      includeUpcomingMs: 1,
      getEvent: async () => ({ attachments: [] }),
      getDoc: vi.fn()
    });
    expect(result).toMatchObject({ pending: 0, waiting: 1 });
  });

  it("deixa pendente quando a ata ainda não foi anexada", async () => {
    const db = fakeSupabase({ appointments: [appt] });
    const result = await importMeetNotes({
      supabase: db.supabase,
      accessToken: "tok",
      now,
      getEvent: async () => ({ attachments: [] }),
      getDoc: vi.fn()
    });
    expect(result).toMatchObject({ imported: 0, pending: 1 });
    expect(db.inserted).toEqual([]);
    expect(db.updated).toEqual([]);
  });

  it("não duplica: rascunho já existente só marca a consulta", async () => {
    const db = fakeSupabase({ appointments: [appt], insertError: { code: "23505", message: "dup" } });
    const result = await importMeetNotes({
      supabase: db.supabase,
      accessToken: "tok",
      now,
      getEvent: async () => ({ attachments: [{ title: "Notes by Gemini", mimeType: DOC, fileId: "n1" }] }),
      getDoc: async () => docWithText
    });
    expect(result).toMatchObject({ imported: 0, failures: [] });
    expect(db.updated).toHaveLength(1);
  });

  it("propaga falta de escopo para a rota pedir reconexão", async () => {
    const db = fakeSupabase({ appointments: [appt] });
    await expect(
      importMeetNotes({
        supabase: db.supabase,
        accessToken: "tok",
        now,
        getEvent: async () => ({ attachments: [{ title: "Notes by Gemini", mimeType: DOC, fileId: "n1" }] }),
        getDoc: async () => {
          throw new GoogleScopeError("sem escopo");
        }
      })
    ).rejects.toBeInstanceOf(GoogleScopeError);
  });
});
