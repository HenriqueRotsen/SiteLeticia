import { hasGeminiConfigured } from "@/lib/ai/gemini";

/**
 * Preferência: GEMINI se houver chave (créditos gratuitos), senão OpenAI.
 * Force com AI_PROVIDER=gemini|openai|auto
 */
export function resolveAiProvider() {
  const forced = String(process.env.AI_PROVIDER || "auto").toLowerCase().trim();

  if (forced === "gemini") return hasGeminiConfigured() ? "gemini" : "none";
  if (forced === "openai") return process.env.OPENAI_API_KEY ? "openai" : "none";

  if (hasGeminiConfigured()) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}
