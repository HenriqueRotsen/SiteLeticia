// Importação experimental da ata do Google Meet ("Anotações do Gemini") para o prontuário.
//
// Caminho escolhido (ver docs/google-meet-ata.md):
//   1. O evento do Google Agenda criado pelo sistema recebe a ata do Gemini como anexo
//      (Google Doc) quando a reunião termina. Ler os anexos usa o escopo calendar.events,
//      que o sistema já tem.
//   2. O conteúdo do Doc é lido pela Google Docs API com documents.readonly (escopo
//      "sensível", não "restrito"), sem precisar de drive.readonly / drive.meet.readonly.
//
// Fica desligado até GOOGLE_MEET_NOTES_ENABLED=true; só então o escopo extra é pedido
// e a Letícia precisa reconectar o Google em Integrações.

export const MEET_NOTES_SOURCE = "google_meet_notes";
export const DOCS_READONLY_SCOPE = "https://www.googleapis.com/auth/documents.readonly";
export const MAX_NOTES_CHARS = 100_000;

const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";
const NOTES_TITLE = /gemini|anota[cç][oõ]es|notes|ata\b/i;
const TRANSCRIPT_TITLE = /transcri/i;

export function isMeetNotesEnabled() {
  return process.env.GOOGLE_MEET_NOTES_ENABLED === "true";
}

/** Escopos extras pedidos no OAuth quando o recurso está ligado. */
export function meetNotesScopes() {
  return isMeetNotesEnabled() ? [DOCS_READONLY_SCOPE] : [];
}

/** Erro de autorização do Google: falta escopo ou a conexão precisa ser refeita. */
export class GoogleScopeError extends Error {
  constructor(message) {
    super(message);
    this.name = "GoogleScopeError";
  }
}

function docIdFromAttachment(attachment) {
  if (attachment?.fileId) return attachment.fileId;
  const match = String(attachment?.fileUrl || "").match(/\/document\/d\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Escolhe, entre os anexos do evento, o Google Doc da ata do Gemini.
 * Se não houver ata, aceita a transcrição (contas Workspace). Outros anexos são ignorados.
 */
export function pickNotesAttachment(attachments) {
  const docs = (attachments || [])
    .filter((item) => item?.mimeType === GOOGLE_DOC_MIME || /docs\.google\.com\/document/.test(item?.fileUrl || ""))
    .map((item) => ({ ...item, documentId: docIdFromAttachment(item) }))
    .filter((item) => item.documentId);

  const notes = docs.find((item) => NOTES_TITLE.test(item.title || "") && !TRANSCRIPT_TITLE.test(item.title || ""));
  if (notes) return { ...notes, kind: "notes" };

  const transcript = docs.find((item) => TRANSCRIPT_TITLE.test(item.title || ""));
  if (transcript) return { ...transcript, kind: "transcript" };

  return null;
}

function textFromContent(content) {
  let out = "";
  for (const element of content || []) {
    if (element.paragraph) {
      for (const part of element.paragraph.elements || []) {
        if (part.textRun?.content) out += part.textRun.content;
        else if (part.person?.personProperties?.name) out += part.person.personProperties.name;
        else if (part.richLink?.richLinkProperties?.title) out += part.richLink.richLinkProperties.title;
      }
    } else if (element.table) {
      for (const row of element.table.tableRows || []) {
        const cells = (row.tableCells || []).map((cell) => textFromContent(cell.content).trim());
        out += `${cells.join(" | ")}\n`;
      }
    }
  }
  return out;
}

function flattenTabs(tabs, acc = []) {
  for (const tab of tabs || []) {
    acc.push(tab);
    flattenTabs(tab.childTabs, acc);
  }
  return acc;
}

/**
 * Converte o JSON de documents.get em texto simples.
 * Docs do Gemini podem ter abas (ex.: "Anotações" e "Transcrição"); a transcrição
 * é deixada de fora quando há outra aba com conteúdo, para o rascunho ficar enxuto.
 */
export function googleDocToPlainText(document) {
  const tabs = flattenTabs(document?.tabs);
  let sections;

  if (tabs.length) {
    const all = tabs
      .map((tab) => ({
        title: tab.tabProperties?.title || "",
        text: textFromContent(tab.documentTab?.body?.content).trim()
      }))
      .filter((tab) => tab.text);
    const nonTranscript = all.filter((tab) => !TRANSCRIPT_TITLE.test(tab.title));
    sections = (nonTranscript.length ? nonTranscript : all).map((tab) => tab.text);
  } else {
    sections = [textFromContent(document?.body?.content).trim()];
  }

  const text = sections
    .filter(Boolean)
    .join("\n\n")
    .replace(/\u000b/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (text.length <= MAX_NOTES_CHARS) return text;
  return `${text.slice(0, MAX_NOTES_CHARS - 60).trimEnd()}\n\n[… texto cortado: abra a ata original no Google Docs]`;
}

export function buildDraftRecord({ appointment, attachment, text }) {
  const header =
    attachment.kind === "transcript"
      ? "Rascunho importado da transcrição do Google Meet. Revise antes de confirmar."
      : "Rascunho importado da ata do Gemini no Google Meet. Revise antes de confirmar.";
  const link = attachment.fileUrl ? `\nOriginal: ${attachment.fileUrl}` : "";

  return {
    patient_id: appointment.patient_id,
    appointment_id: appointment.id,
    session_at: appointment.starts_at,
    title: attachment.kind === "transcript" ? "Transcrição do Meet (rascunho)" : "Ata do Meet (rascunho)",
    body_text: `${header}${link}\n\n${text}`,
    notes: null,
    storage_path: null,
    mime_type: "text/plain",
    file_name: null,
    status: "draft",
    source: MEET_NOTES_SOURCE,
    source_ref: attachment.documentId,
    updated_at: new Date().toISOString()
  };
}

async function googleGet(url, accessToken) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    // Token sem o escopo de leitura de documentos (conexão antiga): precisa reconectar.
    if (response.status === 401 || (response.status === 403 && /insufficient|scope/i.test(body))) {
      throw new GoogleScopeError(`Google recusou o acesso (${response.status}).`);
    }
    throw new Error(`Google API ${response.status}: ${body.slice(0, 200)}`);
  }
  return response.json();
}

export function fetchCalendarEvent(accessToken, eventId, calendarId = "primary") {
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`;
  return googleGet(url, accessToken);
}

export function fetchGoogleDoc(accessToken, documentId) {
  const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}?includeTabsContent=true`;
  return googleGet(url, accessToken);
}
