import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { extractDietPlanFromCsvBuffer } from "@/lib/diets/fatsecret-csv";
import { ALLOWED_CSV_TYPES, MAX_CSV_BYTES } from "@/lib/constants";
import { writeAuditLog, getClientIp } from "@/lib/audit";

function isAllowedCsv(file) {
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  if (ALLOWED_CSV_TYPES.includes(type)) return true;
  return name.endsWith(".csv") || type === "" || type === "application/octet-stream";
}

export async function POST(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get("file");
  const titleOverride = formData.get("title")?.toString()?.trim();

  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "CSV obrigatório." }, { status: 400 });
  }

  if (!isAllowedCsv(file)) {
    return NextResponse.json(
      { message: "Envie o CSV Detailed Report exportado do FatSecret." },
      { status: 400 }
    );
  }

  if (file.size > MAX_CSV_BYTES) {
    return NextResponse.json({ message: "CSV muito grande (máx. 2MB)." }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("id", params.id)
    .maybeSingle();

  if (!patient) {
    return NextResponse.json({ message: "Paciente não encontrado." }, { status: 404 });
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer());
  const defaultTitle =
    titleOverride || `Plano alimentar FatSecret · ${patient.full_name || "paciente"}`;

  let extraction;
  try {
    extraction = await extractDietPlanFromCsvBuffer(originalBuffer, { title: defaultTitle });
  } catch (error) {
    console.error("Diet CSV extract failed:", error);
    return NextResponse.json({ message: "Não foi possível ler o CSV da dieta." }, { status: 500 });
  }

  if (!extraction.plan?.meals?.length) {
    return NextResponse.json(
      {
        message:
          "Não encontramos refeições no arquivo. Use o export CSV Detailed Report do FatSecret."
      },
      { status: 400 }
    );
  }

  const plan = {
    ...extraction.plan,
    title: titleOverride || extraction.plan.title || defaultTitle,
    source: "fatsecret_csv",
    sourcePdfPath: null,
    extractionSummary: extraction.summary,
    extractionMethod: extraction.method
  };

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "diet_csv_extract",
    resourceType: "patient",
    resourceId: params.id,
    ip: getClientIp(request)
  });

  // Só monta o rascunho. O arquivo CSV opcionalmente sobe ao bucket na publicação.
  return NextResponse.json({
    ok: true,
    plan,
    summary: extraction.summary,
    method: extraction.method,
    warning: extraction.warning
  });
}
