import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function formatWhen(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Avisos derivados do estado atual (sem tabela extra). */
export async function GET() {
  const notifications = [];

  try {
    const ctx = await getAuthContext();

    if (ctx.user && ctx.patient && ctx.profile?.role !== "nutritionist") {
      const supabase = createSupabaseAdmin();
      const [{ data: form }, { data: upcoming }] = await Promise.all([
        supabase
          .from("patient_preconsult_forms")
          .select("status")
          .eq("patient_id", ctx.patient.id)
          .maybeSingle(),
        supabase
          .from("appointments")
          .select("id, starts_at, created_at")
          .eq("patient_id", ctx.patient.id)
          .eq("status", "scheduled")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
          .limit(1)
      ]);

      const next = upcoming?.[0];
      if (next && form?.status !== "submitted") {
        notifications.push({
          id: "preconsult-pending",
          title: "Preencha sua ficha pré-consulta",
          body: `Leva cerca de 5 minutos e ajuda a Letícia a aproveitar melhor a consulta de ${formatWhen(
            next.starts_at
          )}.`,
          href: "/app/ficha",
          createdAt: next.created_at || new Date().toISOString(),
          unread: true
        });
      }
    }
  } catch (error) {
    console.error("Notifications failed:", error?.message || error);
  }

  return NextResponse.json({ notifications });
}
