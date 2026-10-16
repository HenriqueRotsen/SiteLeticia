import { PAYMENT_AMOUNT_MATCH_TOLERANCE_CENTS } from "@/lib/constants";

function parseBrlToCents(raw) {
  if (raw == null || raw === "") return null;
  let text = String(raw).trim();
  text = text.replace(/[Rr]\$\s*/g, "").replace(/\s/g, "");

  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  const value = Number(text);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

function parseFlexibleDate(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  const br = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
  if (br) {
    const day = Number(br[1]);
    const month = Number(br[2]);
    let year = Number(br[3]);
    if (year < 100) year += 2000;
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const iso = Date.parse(text);
  if (!Number.isNaN(iso)) return new Date(iso).toISOString();
  return null;
}

export function amountsMatch(extractedCents, expectedCents, tolerance = PAYMENT_AMOUNT_MATCH_TOLERANCE_CENTS) {
  if (extractedCents == null || expectedCents == null) return null;
  return Math.abs(Number(extractedCents) - Number(expectedCents)) <= tolerance;
}

function heuristicFromText(text) {
  const cleaned = String(text || "");
  if (!cleaned.trim()) {
    return {
      amountCents: null,
      paidAt: null,
      payerName: null,
      confidence: 0,
      method: "failed",
      rawText: ""
    };
  }

  const amountPatterns = [
    /(?:valor|total|pago|pagamento|quantia)[^\d]{0,40}R\$\s*([\d.]+,\d{2})/i,
    /R\$\s*([\d.]+,\d{2})/,
    /(?:valor|total)[^\d]{0,20}([\d.]+,\d{2})/i
  ];

  let amountCents = null;
  for (const pattern of amountPatterns) {
    const match = cleaned.match(pattern);
    if (match) {
      amountCents = parseBrlToCents(match[1]);
      if (amountCents != null) break;
    }
  }

  const dateMatch =
    cleaned.match(/(?:data|pago em|pagamento)[^\d]{0,20}(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i) ||
    cleaned.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
  const paidAt = parseFlexibleDate(dateMatch?.[1]);

  const payerMatch =
    cleaned.match(/(?:nome|pagador|remetente|de)[:\s]+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s.'-]{2,60})/i) ||
    null;
  const payerName = payerMatch?.[1]?.trim()?.replace(/\s+/g, " ") || null;

  const confidence = [amountCents, paidAt, payerName].filter(Boolean).length / 3;

  return {
    amountCents,
    paidAt,
    payerName,
    confidence,
    method: amountCents != null ? "heuristic" : "failed",
    rawText: cleaned.slice(0, 4000)
  };
}

async function extractTextFromPdfBuffer(buffer) {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const parsed = await pdfParse(buffer);
    return String(parsed.text || "").trim();
  } catch {
    return "";
  }
}

async function extractWithOpenAIText(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !text?.trim()) return null;

  const model = process.env.OPENAI_PAYMENT_MODEL || process.env.OPENAI_DIET_MODEL || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extraia dados de comprovante de pagamento ou nota fiscal brasileira. Responda JSON com: amountBrl (número ou null), paidAt (ISO ou dd/mm/yyyy ou null), payerName (string ou null), confidence (0-1)."
        },
        {
          role: "user",
          content: `Texto do documento:\n\n${text.slice(0, 8000)}`
        }
      ]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    return {
      amountCents: parseBrlToCents(parsed.amountBrl ?? parsed.amount),
      paidAt: parseFlexibleDate(parsed.paidAt || parsed.date),
      payerName: parsed.payerName ? String(parsed.payerName).trim() : null,
      confidence: Number(parsed.confidence) || 0.7,
      method: "openai",
      rawText: text.slice(0, 4000)
    };
  } catch {
    return null;
  }
}

async function extractWithOpenAIVision(buffer, mimeType) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.OPENAI_PAYMENT_MODEL || "gpt-4o-mini";
  const base64 = buffer.toString("base64");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extraia dados de comprovante de pagamento ou nota fiscal brasileira da imagem. Responda JSON com: amountBrl (número ou null), paidAt (ISO ou dd/mm/yyyy ou null), payerName (string ou null), confidence (0-1)."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia valor, data e nome do pagador deste documento." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` }
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content);
    return {
      amountCents: parseBrlToCents(parsed.amountBrl ?? parsed.amount),
      paidAt: parseFlexibleDate(parsed.paidAt || parsed.date),
      payerName: parsed.payerName ? String(parsed.payerName).trim() : null,
      confidence: Number(parsed.confidence) || 0.7,
      method: "openai",
      rawText: ""
    };
  } catch {
    return null;
  }
}

/**
 * Extrai valor, data e pagador de PDF ou imagem de comprovante/NF.
 */
export async function extractPaymentDocument(buffer, mimeType) {
  const isPdf = mimeType === "application/pdf";
  const isImage = String(mimeType || "").startsWith("image/");

  if (isPdf) {
    const text = await extractTextFromPdfBuffer(buffer);
    const fromAi = await extractWithOpenAIText(text);
    if (fromAi?.amountCents != null) return fromAi;
    return heuristicFromText(text);
  }

  if (isImage) {
    const fromVision = await extractWithOpenAIVision(buffer, mimeType);
    if (fromVision?.amountCents != null) return fromVision;
    return {
      amountCents: null,
      paidAt: null,
      payerName: null,
      confidence: 0,
      method: "failed",
      rawText: ""
    };
  }

  return {
    amountCents: null,
    paidAt: null,
    payerName: null,
    confidence: 0,
    method: "failed",
    rawText: ""
  };
}

export function buildDocumentRowFromExtraction(extraction, expectedAmountCents) {
  const amountCents = extraction?.amountCents ?? null;
  const hasUsefulData = amountCents != null || extraction?.paidAt || extraction?.payerName;

  return {
    extracted_amount_cents: amountCents,
    extracted_paid_at: extraction?.paidAt || null,
    extracted_payer_name: extraction?.payerName || null,
    extraction_status: hasUsefulData ? "ok" : "failed",
    extraction_json: {
      confidence: extraction?.confidence ?? 0,
      method: extraction?.method || "failed",
      rawText: extraction?.rawText || ""
    },
    amount_matches: amountsMatch(amountCents, expectedAmountCents)
  };
}
