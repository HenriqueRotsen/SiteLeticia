/**
 * Cliente mínimo da Gemini API (Google AI Studio).
 * Docs: https://ai.google.dev/api/generate-content
 */

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_INLINE_PDF_BYTES = 4 * 1024 * 1024;

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

  const model = getGeminiModel();
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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Gemini falhou (${response.status}): ${details.slice(0, 240)}`);
  }

  const payload = await response.json();
  const text = extractTextFromResponse(payload);
  if (!text) return null;

  if (!json) return { text, raw: payload };

  try {
    return { data: JSON.parse(stripJsonFence(text)), text, raw: payload };
  } catch {
    throw new Error("Gemini retornou JSON inválido.");
  }
}
