import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const BUCKET = () => process.env.SUPABASE_STORAGE_BUCKET_CLINICAL || "clinical-records";

export async function DELETE(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data: existing, error: existingError } = await auth.ctx.supabase
    .from("clinical_records")
    .select("id, storage_path")
    .eq("id", params.recordId)
    .eq("patient_id", params.id)
    .maybeSingle();

  if (existingError || !existing) {
    return NextResponse.json({ message: "Registro não encontrado." }, { status: 404 });
  }

  if (existing.storage_path) {
    const supabase = createSupabaseAdmin();
    await supabase.storage.from(BUCKET()).remove([existing.storage_path]);
  }

  const { error } = await auth.ctx.supabase
    .from("clinical_records")
    .delete()
    .eq("id", params.recordId)
    .eq("patient_id", params.id);

  if (error) {
    console.error("Clinical record delete failed:", error);
    return NextResponse.json({ message: "Erro ao excluir prontuário." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "clinical_record_delete",
    resourceType: "clinical_record",
    resourceId: params.recordId,
    ip: getClientIp(request)
  });

  return NextResponse.json({ ok: true });
}
