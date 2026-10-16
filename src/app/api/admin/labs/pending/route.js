import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data: reports, error } = await auth.ctx.supabase
    .from("lab_reports")
    .select("id, patient_id, created_at, interpretation_summary, storage_path, patients(full_name)")
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ message: "Não foi possível carregar os exames." }, { status: 500 });
  }

  return NextResponse.json({ reports: reports || [] });
}
