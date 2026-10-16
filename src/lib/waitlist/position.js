export function normalizeWaitlistPhone(value = "") {
  let digits = String(value || "").replace(/\D/g, "");
  // Brasil: remove DDI 55 quando sobra DDD+número (10–11 dígitos).
  if (digits.length >= 12 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  return digits;
}

function phoneLookupVariants(phone) {
  const normalized = normalizeWaitlistPhone(phone);
  if (!normalized) return [];
  const variants = new Set([normalized, `55${normalized}`]);
  return [...variants];
}

export async function getWaitlistEntryByPhone(supabase, phone) {
  const variants = phoneLookupVariants(phone);
  if (!variants.length || variants[0].length < 10) return null;

  const { data, error } = await supabase
    .from("waitlist")
    .select("id, full_name, phone, goal, status, created_at")
    .in("phone", variants)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findPatientByPhone(supabase, phone) {
  const variants = phoneLookupVariants(phone);
  if (!variants.length) return null;

  const { data, error } = await supabase
    .from("patients")
    .select("id, waitlist_id, user_id, phone, source")
    .in("phone", variants)
    .order("created_at", { ascending: true })
    .limit(1)
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
  const existing = await findPatientByPhone(supabase, phoneNormalized);

  if (existing) {
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        full_name: fullName,
        phone: phoneNormalized,
        goal,
        waitlist_id: waitlistId,
        source: existing.source === "admin" ? existing.source : "waitlist",
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

/**
 * Garante que toda entrada da waitlist exista em patients (idempotente).
 */
export async function syncAllWaitlistToPatients(supabase) {
  const { data: entries, error } = await supabase
    .from("waitlist")
    .select("id, full_name, phone, goal")
    .order("id", { ascending: true });

  if (error) throw error;

  let created = 0;
  let linked = 0;
  let failed = 0;
  const errors = [];

  for (const entry of entries || []) {
    try {
      const before = await findPatientByPhone(supabase, entry.phone);
      await syncWaitlistPatient(supabase, {
        waitlistId: entry.id,
        fullName: entry.full_name,
        phone: entry.phone,
        goal: entry.goal
      });
      if (before) linked += 1;
      else created += 1;
    } catch (err) {
      failed += 1;
      errors.push({ waitlistId: entry.id, message: err.message || "Falha ao sincronizar" });
    }
  }

  const { count: waitlistTotal } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true });

  const { count: patientsFromWaitlist } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .or("source.eq.waitlist,waitlist_id.not.is.null");

  return {
    waitlistTotal: waitlistTotal || 0,
    patientsFromWaitlist: patientsFromWaitlist || 0,
    created,
    linked,
    failed,
    errors: errors.slice(0, 10)
  };
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
