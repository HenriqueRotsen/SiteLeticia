/**
 * Cliente mínimo da Gemini API (Google AI Studio).
 * Docs: https://ai.google.dev/api/generate-content
 */

const DEFAULT_MODEL = "gemini-3.5-flash";
const FALLBACK_MODELS = [
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-3.5-flash-lite"
];
const MAX_INLINE_PDF_BYTES = 8 * 1024 * 1024;

export function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "";
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

export function hasGeminiConfigured() {
  return Boolean(getGeminiApiKey());
}

export function canSendPdfInline(buffer) {
  return Boolean(buffer?.length) && buffer.length <= MAX_INLINE_PDF_BYTES;
}

function modelCandidates() {
  const preferred = getGeminiModel();
  return [...new Set([preferred, ...FALLBACK_MODELS])];
}

function extractTextFromResponse(payload) {
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  return parts
    .map((part) => part?.text || "")
    .join("\n")
    .trim();
}

function stripJsonFence(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function buildRequestBody({ prompt, system, pdfBuffer, temperature, json }) {
  const parts = [];

  if (pdfBuffer && canSendPdfInline(pdfBuffer)) {
    parts.push({
      inline_data: {
        mime_type: "application/pdf",
        data: Buffer.from(pdfBuffer).toString("base64")
      }
    });
  }

  parts.push({ text: prompt });

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature,
      ...(json ? { responseMimeType: "application/json" } : {})
    }
  };

  if (system) {
    body.systemInstruction = {
      parts: [{ text: system }]
    };
  }

  return body;
}

async function callGeminiModel(model, body, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000)
    }
  );

  const details = await response.text().catch(() => "");
  return { response, details };
}

/**
 * @param {{
 *   prompt: string,
 *   system?: string,
 *   pdfBuffer?: Buffer|null,
 *   temperature?: number,
 *   json?: boolean
 * }} options
 */
export async function generateGeminiContent({
  prompt,
  system = "",
  pdfBuffer = null,
  temperature = 0.1,
  json = true
} = {}) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;

  const body = buildRequestBody({ prompt, system, pdfBuffer, temperature, json });
  const errors = [];

  for (const model of modelCandidates()) {
    try {
      const { response, details } = await callGeminiModel(model, body, apiKey);

      if (!response.ok) {
        errors.push(`${model}: ${response.status} ${details.slice(0, 160)}`);
        // modelo descontinuado / não encontrado → tenta próximo
        if (response.status === 404 || response.status === 400) continue;
        throw new Error(`Gemini falhou (${response.status}): ${details.slice(0, 240)}`);
      }

      const payload = JSON.parse(details);
      const text = extractTextFromResponse(payload);
      if (!text) {
        errors.push(`${model}: resposta vazia`);
        continue;
      }

      if (!json) return { text, raw: payload, model };

      try {
        return { data: JSON.parse(stripJsonFence(text)), text, raw: payload, model };
      } catch {
        errors.push(`${model}: JSON inválido`);
        continue;
      }
    } catch (error) {
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        errors.push(`${model}: timeout`);
        continue;
      }
      errors.push(`${model}: ${error.message || "erro"}`);
    }
  }

  throw new Error(`Gemini indisponível. ${errors.slice(0, 3).join(" | ")}`);
}
