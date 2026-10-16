import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hashIp } from "@/lib/crypto";

export async function writeAuditLog({ actorId, action, resourceType, resourceId, ip }) {
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from("audit_logs").insert({
      actor_id: actorId || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId ? String(resourceId) : null,
      ip_hash: ip ? hashIp(ip) : null
    });
  } catch {
    // Audit must not break main flow
  }
}

export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
