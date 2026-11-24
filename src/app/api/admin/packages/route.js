import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { isMissingTable } from "@/lib/packages/credits";
import { MIGRATION_MESSAGE, packageInputSchema, packageRow, withoutCardFields } from "@/lib/packages/schema";
import { parsePixCode } from "@/lib/payments/pix-brcode";
import { CARD_MIGRATION_MESSAGE, isMissingPaymentColumn, isValidPaymentLink } from "@/lib/payments/card";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const [{ data, error }, { data: settings }] = await Promise.all([
    supabase.from("consultation_packages").select("*").order("sort_order").order("sessions"),
    supabase.from("payment_settings").select("*").limit(1).maybeSingle()
  ]);
  const regularPriceCents = settings?.consultation_price_cents || 0;
  const cardFeePercent = Number(settings?.card_fee_percent) || 0;

  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ packages: [], regularPriceCents, needsMigration: true, message: MIGRATION_MESSAGE });
    }
    return NextResponse.json({ message: "Não foi possível carregar os pacotes." }, { status: 500 });
  }

  return NextResponse.json({ packages: data || [], regularPriceCents, cardFeePercent });
}

export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let input;
  try {
    input = packageInputSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Confira nome, quantidade de consultas e preço." }, { status: 400 });
  }
  if (input.pixCode && !parsePixCode(input.pixCode).valid) {
    return NextResponse.json({ message: "O PIX copia e cola do pacote está inválido." }, { status: 400 });
  }
  if (!isValidPaymentLink(input.cardLink)) {
    return NextResponse.json({ message: "O link do cartão precisa começar com https://." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  let warning = null;
  let { data, error } = await supabase.from("consultation_packages").insert(packageRow(input)).select("*").single();
  if (error && isMissingPaymentColumn(error)) {
    ({ data, error } = await supabase.from("consultation_packages").insert(withoutCardFields(packageRow(input))).select("*").single());
    if (!error) warning = CARD_MIGRATION_MESSAGE;
  }
  if (error) {
    return NextResponse.json(
      { message: isMissingTable(error) ? MIGRATION_MESSAGE : "Não foi possível criar o pacote." },
      { status: isMissingTable(error) ? 503 : 500 }
    );
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "package_create",
    resourceType: "consultation_package",
    resourceId: data.id,
    ip: getClientIp(request)
  });
  return NextResponse.json({ package: data, warning });
}
