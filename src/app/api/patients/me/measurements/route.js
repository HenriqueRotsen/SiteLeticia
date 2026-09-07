import { NextResponse } from "next/server";
import { requirePatient, requireNutritionist } from "@/lib/auth";
import { bodyMeasurementSchema } from "@/lib/validation/schemas";

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("body_measurements")
    .select("*")
    .eq("patient_id", auth.ctx.patient.id)
    .order("recorded_at", { ascending: true });

  return NextResponse.json({ measurements: data || [] });
}

export async function POST(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  let body;
  try {
    body = bodyMeasurementSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const { data, error } = await auth.ctx.supabase
    .from("body_measurements")
    .insert({
      patient_id: auth.ctx.patient.id,
      weight_kg: body.weightKg,
      waist_cm: body.waistCm,
      hip_cm: body.hipCm,
      notes: body.notes,
      recorded_at: body.recordedAt || new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao salvar." }, { status: 500 });
  return NextResponse.json({ measurement: data });
}

export async function PUT(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const payload = await request.json();
  let body;
  try {
    body = bodyMeasurementSchema.parse(payload);
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  if (!payload.patientId) {
    return NextResponse.json({ message: "patientId obrigatório." }, { status: 400 });
  }

  const { data, error } = await auth.ctx.supabase
    .from("body_measurements")
    .insert({
      patient_id: payload.patientId,
      weight_kg: body.weightKg,
      waist_cm: body.waistCm,
      hip_cm: body.hipCm,
      notes: body.notes,
      recorded_at: body.recordedAt || new Date().toISOString()
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao salvar." }, { status: 500 });
  return NextResponse.json({ measurement: data });
}
