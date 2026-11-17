import { NextResponse } from "next/server";
import { z } from "zod";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { isMissingTable } from "@/lib/packages/credits";
import { MIGRATION_MESSAGE, patientPackageRow } from "@/lib/packages/schema";

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const supabase = createSupabaseAdmin();
  const [{ data, error }, { data: catalog }] = await Promise.all([
    supabase.from("patient_packages").select("*").eq("patient_id", params.id).order("created_at", { ascending: false }),
    supabase.from("consultation_packages").select("*").eq("active", true).order("sort_order").order("sessions")
  ]);
  if (error) {
    if (isMissingTable(error)) {
      return NextResponse.json({ packages: [], catalog: [], needsMigration: true, message: MIGRATION_MESSAGE });
    }
    return NextResponse.json({ message: "Não foi possível carregar os pacotes." }, { status: 500 });
  }
  return NextResponse.json({ packages: data || [], catalog: catalog || [] });
}

const schema = z.object({ packageId: z.string().min(1), paid: z.boolean().default(false) });

// A nutricionista lança um pacote para o paciente (ex.: vendido no consultório).
export async function POST(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = schema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Escolha um pacote." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: pkg } = await supabase.from("consultation_packages").select("*").eq("id", body.packageId).maybeSingle();
  if (!pkg) return NextResponse.json({ message: "Pacote não encontrado." }, { status: 404 });

  const { data, error } = await supabase
    .from("patient_packages")
    .insert(patientPackageRow(pkg, params.id, { paid: body.paid }))
    .select("*")
    .single();
  if (error) {
    return NextResponse.json(
      { message: isMissingTable(error) ? MIGRATION_MESSAGE : "Não foi possível adicionar o pacote." },
      { status: isMissingTable(error) ? 503 : 500 }
    );
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "patient_package_grant",
    resourceType: "patient_package",
    resourceId: data.id,
    ip: getClientIp(request)
  });
  return NextResponse.json({ package: data });
}
