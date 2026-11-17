// Créditos de pacote nas consultas (servidor). Se as tabelas de pacote ainda não existem
// (SQL não rodado), tudo segue como consulta avulsa.
import { pickUsablePackage } from "@/lib/packages/pricing";

export function isMissingTable(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`;
  return /42P01|PGRST205|does not exist|Could not find the table|patient_package/.test(text);
}

export async function listPatientPackages(supabase, patientId) {
  const { data, error } = await supabase
    .from("patient_packages")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

// Reserva um crédito para a consulta. Devolve o pacote usado (ou null para consulta avulsa).
export async function reservePackageCredit(supabase, patientId) {
  const usable = pickUsablePackage(await listPatientPackages(supabase, patientId));
  if (!usable) return null;
  const { data, error } = await supabase
    .from("patient_packages")
    .update({ sessions_used: usable.sessions_used + 1, updated_at: new Date().toISOString() })
    .eq("id", usable.id)
    .eq("sessions_used", usable.sessions_used)
    .select("*")
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function releasePackageCredit(supabase, patientPackageId) {
  if (!patientPackageId) return;
  const { data } = await supabase
    .from("patient_packages")
    .select("id, sessions_used")
    .eq("id", patientPackageId)
    .maybeSingle();
  if (!data || data.sessions_used <= 0) return;
  await supabase
    .from("patient_packages")
    .update({ sessions_used: data.sessions_used - 1, updated_at: new Date().toISOString() })
    .eq("id", data.id);
}

// Campos da consulta paga com crédito de pacote.
export function packageAppointmentFields(patientPackage) {
  if (!patientPackage) return {};
  return {
    patient_package_id: patientPackage.id,
    amount_cents: 0,
    payment_status: "paid",
    payment_validated_at: new Date().toISOString()
  };
}
