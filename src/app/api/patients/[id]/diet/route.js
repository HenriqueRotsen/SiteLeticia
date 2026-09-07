import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireNutritionist } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { dietPlanSchema } from "@/lib/validation/schemas";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import { ALLOWED_CSV_TYPES, MAX_CSV_BYTES } from "@/lib/constants";

function isAllowedCsv(file) {
  if (!file || typeof file === "string") return false;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  if (ALLOWED_CSV_TYPES.includes(type)) return true;
  return name.endsWith(".csv") || type === "" || type === "application/octet-stream";
}

async function parseDietBody(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawPlan = formData.get("plan");
    if (!rawPlan || typeof rawPlan !== "string") {
      throw new Error("invalid_plan");
    }
    return {
      body: dietPlanSchema.parse(JSON.parse(rawPlan)),
      file: formData.get("file")
    };
  }

  return {
    body: dietPlanSchema.parse(await request.json()),
    file: null
  };
}

async function maybeUploadDietCsv(patientId, file) {
  if (!isAllowedCsv(file)) return null;
  if (file.size > MAX_CSV_BYTES) return null;

  const supabase = createSupabaseAdmin();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET_DIETS || "diet-plans";
  const path = `${patientId}/${randomUUID()}.csv`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "text/csv"
  });

  if (error) {
    console.error("Diet CSV upload on save failed:", error);
    return null;
  }

  return path;
}

export async function GET(_request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("diet_plans")
    .select("*, diet_meals(*, diet_items(*)), diet_supplements(*), diet_referrals(*)")
    .eq("patient_id", params.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ dietPlans: data || [] });
}

export async function POST(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  let file;
  try {
    ({ body, file } = await parseDietBody(request));
  } catch {
    return NextResponse.json({ message: "Plano inválido." }, { status: 400 });
  }

  if (!body.meals?.length) {
    return NextResponse.json(
      { message: "Inclua ao menos uma refeição com itens antes de salvar." },
      { status: 400 }
    );
  }

  // Arquiva planos ativos anteriores ao publicar um novo.
  if (body.status === "active") {
    await auth.ctx.supabase
      .from("diet_plans")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("patient_id", params.id)
      .eq("status", "active");
  }

  const uploadedPath = body.sourcePdfPath || (await maybeUploadDietCsv(params.id, file));

  const planInsert = {
    patient_id: params.id,
    title: body.title,
    notes: body.notes || null,
    status: body.status,
    source: body.source || "manual",
    source_pdf_path: uploadedPath || null,
    extraction_summary: body.extractionSummary || null,
    extraction_method: body.extractionMethod || null
  };

  const { data: plan, error } = await auth.ctx.supabase
    .from("diet_plans")
    .insert(planInsert)
    .select("*")
    .single();

  if (error) {
    console.error("Diet plan insert failed:", error);
    const message =
      error.message?.includes("source") || error.message?.includes("column")
        ? "Banco desatualizado: execute supabase/migrate-diet-pdf.sql no Supabase."
        : "Erro ao salvar plano.";
    return NextResponse.json({ message }, { status: 500 });
  }

  for (const meal of body.meals) {
    const { data: mealRow, error: mealError } = await auth.ctx.supabase
      .from("diet_meals")
      .insert({ diet_plan_id: plan.id, name: meal.name, sort_order: meal.sortOrder })
      .select("*")
      .single();

    if (mealError || !mealRow) {
      console.error("Diet meal insert failed:", mealError);
      return NextResponse.json({ message: "Erro ao salvar refeições." }, { status: 500 });
    }

    if (meal.items?.length) {
      const { error: itemsError } = await auth.ctx.supabase.from("diet_items").insert(
        meal.items.map((item) => ({
          meal_id: mealRow.id,
          source: item.source,
          external_id: item.externalId ?? null,
          label: item.label,
          quantity: item.quantity,
          portion_g: item.portionG,
          nutrition_snapshot: item.nutritionSnapshot || null
        }))
      );

      if (itemsError) {
        console.error("Diet items insert failed:", itemsError);
        return NextResponse.json(
          {
            message:
              itemsError.message?.includes("fatsecret_csv") ||
              itemsError.message?.includes("fatsecret_pdf")
                ? "Banco desatualizado: execute supabase/migrate-diet-pdf.sql no Supabase."
                : "Erro ao salvar itens da dieta."
          },
          { status: 500 }
        );
      }
    }
  }

  if (body.supplements?.length) {
    const { error: supplementsError } = await auth.ctx.supabase.from("diet_supplements").insert(
      body.supplements.map((item, index) => ({
        diet_plan_id: plan.id,
        sort_order: item.sortOrder ?? index,
        product_name: item.productName,
        dosage: item.dosage,
        posology: item.posology,
        notes: item.notes || null
      }))
    );

    if (supplementsError) {
      console.error("Diet supplements insert failed:", supplementsError);
      return NextResponse.json(
        {
          message: supplementsError.message?.includes("diet_supplements")
            ? "Banco desatualizado: execute supabase/migrate-diet-prescriptions.sql no Supabase."
            : "Erro ao salvar suplementação."
        },
        { status: 500 }
      );
    }
  }

  if (body.referrals?.length) {
    const { error: referralsError } = await auth.ctx.supabase.from("diet_referrals").insert(
      body.referrals.map((item, index) => ({
        diet_plan_id: plan.id,
        sort_order: item.sortOrder ?? index,
        specialty: item.specialty,
        professional_name: item.professionalName || null,
        reason: item.reason,
        urgency: item.urgency || "routine",
        notes: item.notes || null
      }))
    );

    if (referralsError) {
      console.error("Diet referrals insert failed:", referralsError);
      return NextResponse.json(
        {
          message: referralsError.message?.includes("diet_referrals")
            ? "Banco desatualizado: execute supabase/migrate-diet-prescriptions.sql no Supabase."
            : "Erro ao salvar encaminhamentos."
        },
        { status: 500 }
      );
    }
  }

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "diet_plan_create",
    resourceType: "patient",
    resourceId: params.id,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    ok: true,
    planId: plan.id,
    plan,
    uploaded: Boolean(uploadedPath)
  });
}
