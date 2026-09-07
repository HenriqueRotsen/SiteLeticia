export function normalizeWaitlistPhone(value = "") {
  return String(value).replace(/\D/g, "");
}

export async function getWaitlistEntryByPhone(supabase, phone) {
  const normalized = normalizeWaitlistPhone(phone);
  if (normalized.length < 10) return null;

  const { data, error } = await supabase
    .from("waitlist")
    .select("id, full_name, phone, goal, status, created_at")
    .eq("phone", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function computeWaitlistPosition(supabase, waitlistId) {
  const { count, error } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .eq("status", "waiting")
    .lte("id", waitlistId);

  if (error) throw error;
  return count || 1;
}

export async function getWaitlistStatus(supabase, { phone, waitlistId } = {}) {
  let entry = null;

  if (waitlistId) {
    const { data, error } = await supabase
      .from("waitlist")
      .select("id, full_name, phone, goal, status, created_at")
      .eq("id", waitlistId)
      .maybeSingle();

    if (error) throw error;
    entry = data;
  } else if (phone) {
    entry = await getWaitlistEntryByPhone(supabase, phone);
  }

  if (!entry) {
    return { found: false };
  }

  if (entry.status === "called") {
    return {
      found: true,
      status: "called",
      waitlistId: entry.id,
      fullName: entry.full_name,
      message:
        "Sua vaga foi liberada. Em breve a equipe entrará em contato pelo WhatsApp cadastrado."
    };
  }

  const position = await computeWaitlistPosition(supabase, entry.id);

  return {
    found: true,
    status: "waiting",
    waitlistId: entry.id,
    fullName: entry.full_name,
    position,
    message: "Essa posição considera apenas pacientes ainda aguardando atendimento."
  };
}

export async function syncWaitlistPatient(supabase, { waitlistId, fullName, phone, goal }) {
  const phoneNormalized = normalizeWaitlistPhone(phone);

  const { data: existing, error: existingError } = await supabase
    .from("patients")
    .select("id, waitlist_id, user_id")
    .eq("phone", phoneNormalized)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        full_name: fullName,
        phone: phoneNormalized,
        goal,
        waitlist_id: waitlistId,
        updated_at: new Date().toISOString()
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;

    await supabase
      .from("waitlist")
      .update({ converted_patient_id: existing.id })
      .eq("id", waitlistId);

    return existing.id;
  }

  const { data: created, error: insertError } = await supabase
    .from("patients")
    .insert({
      full_name: fullName,
      phone: phoneNormalized,
      goal,
      waitlist_id: waitlistId,
      source: "waitlist",
      cpf: null,
      cpf_hash: null
    })
    .select("id")
    .single();

  if (insertError) throw insertError;

  await supabase
    .from("waitlist")
    .update({ converted_patient_id: created.id })
    .eq("id", waitlistId);

  return created.id;
}

export async function ensureWaitlistEntry(supabase, { fullName, phone, goal }) {
  const phoneNormalized = normalizeWaitlistPhone(phone);
  const existing = await getWaitlistEntryByPhone(supabase, phoneNormalized);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("waitlist")
    .insert({
      full_name: fullName.trim(),
      phone: phoneNormalized,
      goal
    })
    .select("id, full_name, phone, goal, status, created_at")
    .single();

  if (error) throw error;
  return data;
}
