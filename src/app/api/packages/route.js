import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { isMissingTable } from "@/lib/packages/credits";
import { patientPackageRow, withoutCardFields } from "@/lib/packages/schema";
import { isMissingPaymentColumn } from "@/lib/payments/card";

// Pacotes à venda + os pacotes do paciente.
export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const [{ data: catalog, error }, { data: mine }, { data: settings }] = await Promise.all([
    supabase.from("consultation_packages").select("*").eq("active", true).order("sort_order").order("sessions"),
    supabase.from("patient_packages").select("*").eq("patient_id", auth.ctx.patient.id).order("created_at", { ascending: false }),
    supabase.from("payment_settings").select("*").limit(1).maybeSingle()
  ]);

  if (error && !isMissingTable(error)) {
    return NextResponse.json({ message: "Não foi possível carregar os pacotes." }, { status: 500 });
  }

  return NextResponse.json({
    // Só o que o paciente precisa ver (sem campos internos).
    catalog: (catalog || []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      sessions: pkg.sessions,
      price_cents: pkg.price_cents,
      pix_code: pkg.pix_code || null,
      card_price_cents: pkg.card_price_cents || null,
      card_link: pkg.card_link || null,
      card_fee_percent: pkg.card_fee_percent ?? null,
      card_installments: pkg.card_installments ?? null
    })),
    mine: mine || [],
    regularPriceCents: settings?.consultation_price_cents || 0,
    cardFeePercent: Number(settings?.card_fee_percent) || 0,
    cardMaxInstallments: Number(settings?.card_max_installments) || 1
  });
}

const schema = z.object({ packageId: z.string().min(1), paymentMethod: z.enum(["pix", "card"]).default("pix") });

// O paciente contrata um pacote: fica aguardando pagamento até a Letícia validar.
export async function POST(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Escolha um pacote." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: pkg } = await supabase
    .from("consultation_packages")
    .select("*")
    .eq("id", body.packageId)
    .eq("active", true)
    .maybeSingle();
  if (!pkg) return NextResponse.json({ message: "Pacote indisponível." }, { status: 404 });

  const { data: pending } = await supabase
    .from("patient_packages")
    .select("id")
    .eq("patient_id", auth.ctx.patient.id)
    .eq("payment_status", "pending")
    .limit(1);
  if (pending?.length) {
    return NextResponse.json(
      { message: "Você já tem um pacote aguardando pagamento. Assim que a Letícia confirmar, você pode contratar outro." },
      { status: 409 }
    );
  }

  const { data: settings } = await supabase.from("payment_settings").select("*").limit(1).maybeSingle();
  const row = patientPackageRow(pkg, auth.ctx.patient.id, { paymentMethod: body.paymentMethod, settings: settings || {} });
  let { data, error } = await supabase.from("patient_packages").insert(row).select("*").single();
  if (error && isMissingPaymentColumn(error)) {
    // Antes da migração do cartão: contrata no PIX.
    const pixRow = patientPackageRow(pkg, auth.ctx.patient.id);
    ({ data, error } = await supabase.from("patient_packages").insert(withoutCardFields(pixRow)).select("*").single());
  }
  if (error) {
    return NextResponse.json({ message: "Não foi possível contratar o pacote." }, { status: 500 });
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "patient_package_request",
    resourceType: "patient_package",
    resourceId: data.id,
    ip: getClientIp(request)
  });
  return NextResponse.json({ package: data });
}
