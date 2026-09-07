import { NextResponse } from "next/server";
import { requireAuth, requireNutritionist } from "@/lib/auth";
import { refreshComputedInsights } from "@/lib/insights/compute";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(_request, { params }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const isNutritionist = auth.ctx.profile?.role === "nutritionist";
  let patientId = params.id;

  if (!isNutritionist) {
    if (!auth.ctx.patient || auth.ctx.patient.id !== params.id) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }
    patientId = auth.ctx.patient.id;
  }

  const supabase = createSupabaseAdmin();
  await refreshComputedInsights(patientId);

  let query = supabase
    .from("patient_insights")
    .select("*")
    .eq("patient_id", patientId)
    .order("computed_at", { ascending: false });

  if (!isNutritionist) {
    query = query.eq("visible_to_patient", true);
  }

  const { data } = await query;
  return NextResponse.json({ insights: data || [] });
}

export async function POST(request, { params }) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { title, body, visibleToPatient = true } = await request.json();
  if (!title || !body) {
    return NextResponse.json({ message: "Título e texto obrigatórios." }, { status: 400 });
  }

  const { data, error } = await auth.ctx.supabase
    .from("patient_insights")
    .insert({
      patient_id: params.id,
      type: "manual",
      title,
      body,
      visible_to_patient: visibleToPatient
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao salvar insight." }, { status: 500 });
  return NextResponse.json({ insight: data });
}
