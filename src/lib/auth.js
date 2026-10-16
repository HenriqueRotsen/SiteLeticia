import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null, patient: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: patient } = await supabase
    .from("patients")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, profile, patient };
}

export async function requireAuth() {
  const ctx = await getAuthContext();
  if (!ctx.user) {
    return { error: NextResponse.json({ message: "Não autenticado." }, { status: 401 }) };
  }
  return { ctx };
}

export async function requireNutritionist() {
  const result = await requireAuth();
  if (result.error) return result;
  if (result.ctx.profile?.role !== "nutritionist") {
    return { error: NextResponse.json({ message: "Acesso negado." }, { status: 403 }) };
  }
  return result;
}

export async function requirePatient() {
  const result = await requireAuth();
  if (result.error) return result;
  if (!result.ctx.patient) {
    return { error: NextResponse.json({ message: "Perfil de paciente não encontrado." }, { status: 404 }) };
  }
  return result;
}
