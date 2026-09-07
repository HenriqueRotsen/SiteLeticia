import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function computePatientInsights(patientId) {
  const supabase = createSupabaseAdmin();
  const insights = [];

  const { data: nextAppt } = await supabase
    .from("appointments")
    .select("starts_at, meet_link, payment_status")
    .eq("patient_id", patientId)
    .eq("status", "scheduled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (nextAppt) {
    insights.push({
      type: "computed",
      title: "Próxima consulta",
      body: `Sua consulta está marcada para ${new Date(nextAppt.starts_at).toLocaleString("pt-BR")}.`,
      visible_to_patient: true
    });
  }

  const { data: measurements } = await supabase
    .from("body_measurements")
    .select("weight_kg, recorded_at")
    .eq("patient_id", patientId)
    .order("recorded_at", { ascending: false })
    .limit(2);

  if (measurements?.length === 2 && measurements[0].weight_kg && measurements[1].weight_kg) {
    const diff = Number(measurements[0].weight_kg) - Number(measurements[1].weight_kg);
    const direction = diff > 0 ? "aumento" : "redução";
    insights.push({
      type: "computed",
      title: "Evolução de peso",
      body: `Entre as duas últimas medições houve ${direction} de ${Math.abs(diff).toFixed(1)} kg.`,
      visible_to_patient: true
    });
  }

  const { data: alteredLabs } = await supabase
    .from("lab_results")
    .select("marker_name, flag, report_id, lab_reports!inner(patient_id, status)")
    .eq("lab_reports.patient_id", patientId)
    .eq("lab_reports.status", "published")
    .in("flag", ["low", "high"])
    .limit(5);

  if (alteredLabs?.length) {
    insights.push({
      type: "computed",
      title: "Exames para acompanhar",
      body: `${alteredLabs.length} marcador(es) publicado(s) estão fora da faixa de referência. Veja a aba Exames para detalhes.`,
      visible_to_patient: true
    });
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: checkins } = await supabase
    .from("diet_checkins")
    .select("adhered")
    .eq("patient_id", patientId)
    .gte("checked_at", thirtyDaysAgo.toISOString().slice(0, 10));

  if (checkins?.length) {
    const adhered = checkins.filter((c) => c.adhered).length;
    const pct = Math.round((adhered / checkins.length) * 100);
    insights.push({
      type: "computed",
      title: "Adesão à dieta (30 dias)",
      body: `Você registrou adesão em ${pct}% dos check-ins do período.`,
      visible_to_patient: true
    });
  }

  return insights;
}

export async function refreshComputedInsights(patientId) {
  const supabase = createSupabaseAdmin();
  await supabase.from("patient_insights").delete().eq("patient_id", patientId).eq("type", "computed");

  const insights = await computePatientInsights(patientId);
  if (!insights.length) return [];

  const rows = insights.map((i) => ({
    patient_id: patientId,
    type: "computed",
    title: i.title,
    body: i.body,
    visible_to_patient: i.visible_to_patient,
    computed_at: new Date().toISOString()
  }));

  const { data } = await supabase.from("patient_insights").insert(rows).select("*");
  return data || [];
}
