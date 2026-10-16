import { NextResponse } from "next/server";
import { z } from "zod";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";

const schema = z.object({
  bookingEnabled: z.boolean()
});

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("payment_settings")
    .select("id, booking_enabled")
    .limit(1)
    .maybeSingle();

  if (error && String(error.message || "").includes("booking_enabled")) {
    return NextResponse.json({
      bookingEnabled: true,
      needsMigration: true,
      message: "Rode o SQL migrate-booking-enabled.sql no Supabase."
    });
  }

  return NextResponse.json({
    bookingEnabled: data?.booking_enabled !== false,
    settingsId: data?.id || null
  });
}

export async function PUT(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: existing } = await supabase.from("payment_settings").select("id").limit(1).maybeSingle();

  const payload = {
    booking_enabled: body.bookingEnabled,
    updated_at: new Date().toISOString()
  };

  let result;
  if (existing?.id) {
    result = await supabase
      .from("payment_settings")
      .update(payload)
      .eq("id", existing.id)
      .select("id, booking_enabled")
      .single();
  } else {
    result = await supabase
      .from("payment_settings")
      .insert({
        ...payload,
        consultation_price_cents: 0,
        instructions: "",
        cancellation_policy: ""
      })
      .select("id, booking_enabled")
      .single();
  }

  if (result.error) {
    const msg = result.error.message || "";
    if (msg.includes("booking_enabled")) {
      return NextResponse.json(
        {
          message:
            "É preciso rodar o SQL migrate-booking-enabled.sql no Supabase antes de usar este controle."
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ message: "Não foi possível salvar." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "booking_settings_update",
    resourceType: "payment_settings",
    resourceId: result.data?.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    bookingEnabled: result.data?.booking_enabled !== false
  });
}
