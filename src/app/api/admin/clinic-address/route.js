import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { isAddressComplete, sanitizeAddress } from "@/lib/appointments/location";

const MIGRATION_MESSAGE =
  "É preciso rodar o SQL migrate-presencial-pacotes-pix.sql no Supabase antes de salvar o endereço.";

function missingColumn(error) {
  return String(error?.message || "").includes("clinic_address");
}

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("payment_settings")
    .select("id, clinic_address")
    .limit(1)
    .maybeSingle();

  if (error && missingColumn(error)) {
    return NextResponse.json({ address: null, needsMigration: true, message: MIGRATION_MESSAGE });
  }

  return NextResponse.json({ address: data?.clinic_address || null });
}

export async function PUT(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const address = sanitizeAddress(body?.address || {});
  if (!isAddressComplete(address)) {
    return NextResponse.json(
      { message: "Preencha pelo menos rua, número, cidade e estado." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const { data: existing } = await supabase.from("payment_settings").select("id").limit(1).maybeSingle();
  const payload = { clinic_address: address, updated_at: new Date().toISOString() };

  const result = existing?.id
    ? await supabase.from("payment_settings").update(payload).eq("id", existing.id).select("id, clinic_address").single()
    : await supabase
        .from("payment_settings")
        .insert({ ...payload, consultation_price_cents: 0, instructions: "", cancellation_policy: "" })
        .select("id, clinic_address")
        .single();

  if (result.error) {
    if (missingColumn(result.error)) {
      return NextResponse.json({ message: MIGRATION_MESSAGE }, { status: 503 });
    }
    return NextResponse.json({ message: "Não foi possível salvar o endereço." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "clinic_address_update",
    resourceType: "payment_settings",
    resourceId: result.data?.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({ address: result.data?.clinic_address || address });
}
