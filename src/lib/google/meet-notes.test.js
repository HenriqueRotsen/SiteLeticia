import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DOCS_READONLY_SCOPE,
  MAX_NOTES_CHARS,
  buildDraftRecord,
  googleDocToPlainText,
  meetNotesScopes,
  pickNotesAttachment
} from "./meet-notes";

const DOC = "application/vnd.google-apps.document";

function para(text) {
  return { paragraph: { elements: [{ textRun: { content: text } }] } };
}

describe("meetNotesScopes", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("não pede escopo extra com o recurso desligado", () => {
    vi.stubEnv("GOOGLE_MEET_NOTES_ENABLED", "");
    expect(meetNotesScopes()).toEqual([]);
  });

  it("pede documents.readonly quando ligado", () => {
    vi.stubEnv("GOOGLE_MEET_NOTES_ENABLED", "true");
    expect(meetNotesScopes()).toEqual([DOCS_READONLY_SCOPE]);
  });
});

describe("pickNotesAttachment", () => {
  it("prefere a ata do Gemini à transcrição e ignora outros anexos", () => {
    const picked = pickNotesAttachment([
      { title: "Cardápio.pdf", mimeType: "application/pdf", fileId: "pdf1" },
      { title: "Consulta - Transcrição", mimeType: DOC, fileId: "t1" },
      { title: "Anotações do Gemini", mimeType: DOC, fileId: "n1", fileUrl: "https://docs.google.com/document/d/n1/edit" }
    ]);
    expect(picked).toMatchObject({ documentId: "n1", kind: "notes" });
  });

  it("usa a transcrição quando não há ata", () => {
    expect(pickNotesAttachment([{ title: "Meeting transcript", mimeType: DOC, fileId: "t1" }])).toMatchObject({
      documentId: "t1",
      kind: "transcript"
    });
  });

  it("extrai o id pela URL quando fileId falta", () => {
    expect(
      pickNotesAttachment([{ title: "Notes by Gemini", fileUrl: "https://docs.google.com/document/d/abc_123-x/edit" }])
    ).toMatchObject({ documentId: "abc_123-x" });
  });

  it("retorna null sem anexos relevantes", () => {
    expect(pickNotesAttachment(undefined)).toBeNull();
    expect(pickNotesAttachment([{ title: "Plano alimentar", mimeType: DOC, fileId: "x" }])).toBeNull();
  });
});

describe("googleDocToPlainText", () => {
  it("lê o corpo de documentos sem abas, incluindo tabelas", () => {
    const text = googleDocToPlainText({
      body: {
        content: [
          para("Resumo\n"),
          para("Paciente relata melhora.\n"),
          {
            table: {
              tableRows: [{ tableCells: [{ content: [para("Peso\n")] }, { content: [para("70 kg\n")] }] }]
            }
          }
        ]
      }
    });
    expect(text).toBe("Resumo\nPaciente relata melhora.\nPeso | 70 kg");
  });

  it("deixa a aba de transcrição de fora quando há anotações", () => {
    const text = googleDocToPlainText({
      tabs: [
        { tabProperties: { title: "Anotações" }, documentTab: { body: { content: [para("Próximos passos\n")] } } },
        { tabProperties: { title: "Transcrição" }, documentTab: { body: { content: [para("fala longa\n")] } } }
      ]
    });
    expect(text).toBe("Próximos passos");
  });

  it("usa a transcrição se for a única aba com texto", () => {
    const text = googleDocToPlainText({
      tabs: [{ tabProperties: { title: "Transcript" }, documentTab: { body: { content: [para("oi\n")] } } }]
    });
    expect(text).toBe("oi");
  });

  it("corta textos muito longos", () => {
    const text = googleDocToPlainText({ body: { content: [para("a".repeat(MAX_NOTES_CHARS + 500))] } });
    expect(text.length).toBeLessThanOrEqual(MAX_NOTES_CHARS);
    expect(text).toMatch(/texto cortado/);
  });
});

describe("buildDraftRecord", () => {
  it("monta um rascunho ligado à consulta", () => {
    const record = buildDraftRecord({
      appointment: { id: "a1", patient_id: "p1", starts_at: "2026-11-10T13:00:00.000Z" },
      attachment: { kind: "notes", documentId: "n1", fileUrl: "https://docs.google.com/document/d/n1/edit" },
      text: "Resumo"
    });
    expect(record).toMatchObject({
      patient_id: "p1",
      appointment_id: "a1",
      session_at: "2026-11-10T13:00:00.000Z",
      status: "draft",
      source: "google_meet_notes",
      source_ref: "n1"
    });
    expect(record.body_text).toContain("Revise antes de confirmar");
    expect(record.body_text).toContain("Resumo");
  });
});
