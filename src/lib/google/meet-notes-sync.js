import { GoogleReconnectError, getGoogleAccessToken } from "@/lib/google/calendar";
import { GoogleScopeError, isMeetNotesEnabled } from "@/lib/google/meet-notes";
import { importMeetNotes } from "@/lib/google/import-meet-notes";

/**
 * Busca as atas do Meet e salva como rascunho. Usado pelo cron (GitHub Actions)
 * e pelo botão "Buscar atas do Meet" do prontuário.
 * Retorna { httpStatus, body } para a rota responder.
 */
export async function syncMeetNotes({ supabase, nutritionistId, deps = {} }) {
  const getToken = deps.getToken || getGoogleAccessToken;
  const runImport = deps.runImport || importMeetNotes;

  if (!isMeetNotesEnabled()) {
    return {
      httpStatus: 200,
      body: { ok: true, skipped: "disabled", message: "Importação de atas do Meet desligada no servidor." }
    };
  }

  let accessToken;
  try {
    accessToken = await getToken(nutritionistId);
  } catch (err) {
    if (err instanceof GoogleReconnectError) {
      return {
        httpStatus: 200,
        body: { ok: false, needsReconnect: true, message: "Reconecte o Google em Configurações → Integrações." }
      };
    }
    return { httpStatus: 502, body: { ok: false, message: "Falha ao obter acesso ao Google." } };
  }

  if (!accessToken) {
    return {
      httpStatus: 200,
      body: { ok: false, needsReconnect: true, message: "Google não conectado. Conecte em Configurações → Integrações." }
    };
  }

  try {
    const result = await runImport({ supabase, accessToken });
    return { httpStatus: 200, body: { ok: result.failures.length === 0, ...result } };
  } catch (err) {
    if (err instanceof GoogleScopeError) {
      return {
        httpStatus: 200,
        body: {
          ok: false,
          needsReconnect: true,
          message:
            "O Google não autorizou a leitura da ata. Reconecte o Google em Integrações e aceite o acesso ao Google Docs."
        }
      };
    }
    console.error("Meet notes import failed:", err);
    return { httpStatus: 500, body: { ok: false, message: "Falha ao importar atas." } };
  }
}

export { describeSyncResult } from "@/lib/google/meet-notes-format";
