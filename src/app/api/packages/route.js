import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePatient } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { isMissingTable } from "@/lib/packages/credits";
import { patientPackageRow } from "@/lib/packages/schema";

// Pacotes à venda + os pacotes do paciente.
export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const [{ data: catalog, error }, { data: mine }, { data: settings }] = await Promise.all([
    supabase.from("consultation_packages").select("id, name, description, sessions, price_cents, pix_code").eq("active", true).order("sort_order").order("sessions"),
    supabase.from("patient_packages").select("*").eq("patient_id", auth.ctx.patient.id).order("created_at", { ascending: false }),
    supabase.from("payment_settings").select("consultation_price_cents").limit(1).maybeSingle()
  ]);

  if (error && !isMissingTable(error)) {
    return NextResponse.json({ message: "Não foi possível carregar os pacotes." }, { status: 500 });
  }

  return NextResponse.json({
    catalog: catalog || [],
    mine: mine || [],
    regularPriceCents: settings?.consultation_price_cents || 0
  });
}

const schema = z.object({ packageId: z.string().min(1) });

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

  const { data, error } = await supabase
    .from("patient_packages")
    .insert(patientPackageRow(pkg, auth.ctx.patient.id))
    .select("*")
    .single();
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
