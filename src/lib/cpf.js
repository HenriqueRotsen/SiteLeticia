import crypto from "crypto";
import { normalizeCpf } from "@/lib/cpf-utils";

export {
  formatCpf,
  isValidCpf,
  maskCpf,
  normalizeCpf
} from "@/lib/cpf-utils";

export function hashCpf(cpf) {
  const secret =
    process.env.CPF_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-cpf-secret";
  return crypto.createHmac("sha256", secret).update(normalizeCpf(cpf)).digest("hex");
}
