import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { hashCpf } from "@/lib/cpf";
import { signupSchema } from "@/lib/validation/schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { getClientIp, writeAuditLog } from "@/lib/audit";
import { PRIVACY_POLICY_VERSION, TERMS_VERSION } from "@/lib/constants";
import {
  ensureWaitlistEntry,
  getWaitlistStatus,
  syncWaitlistPatient
} from "@/lib/waitlist/position";

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`signup:${ip}`, { limit: 5, windowMs: 15 * 60_000 });
  if (!rate.allowed) return rateLimitResponse(rate.retryAfterMs);

  let body;
  try {
    body = signupSchema.parse(await request.json());
  } catch (error) {
    return NextResponse.json(
      { message: error.errors?.[0]?.message || "Dados inválidos." },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdmin();
  const phoneNormalized = body.phone.replace(/\D/g, "");

  const { data: existingByCpf } = await supabase
    .from("patients")
    .select("id, user_id, cpf, waitlist_id, phone")
    .eq("cpf", body.cpf)
    .maybeSingle();

  const { data: existingByPhone } = await supabase
    .from("patients")
    .select("id, user_id, cpf, waitlist_id, phone")
    .eq("phone", phoneNormalized)
    .maybeSingle();

  if (existingByCpf?.user_id) {
    return NextResponse.json({ message: "CPF já possui conta cadastrada." }, { status: 409 });
  }

  if (existingByPhone?.user_id && existingByPhone.id !== existingByCpf?.id) {
    return NextResponse.json({ message: "Telefone já vinculado a outra conta." }, { status: 409 });
  }

  if (
    existingByPhone?.cpf &&
    existingByPhone.cpf !== body.cpf &&
    existingByPhone.id !== existingByCpf?.id
  ) {
    return NextResponse.json({ message: "Telefone já cadastrado com outro CPF." }, { status: 409 });
  }

  let patientToLink = existingByCpf || null;

  if (!patientToLink && existingByPhone && !existingByPhone.cpf) {
    patientToLink = existingByPhone;
  } else if (!patientToLink && existingByPhone?.cpf === body.cpf) {
    patientToLink = existingByPhone;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.fullName,
      phone: phoneNormalized,
      role: "patient"
    }
  });

  if (authError) {
    return NextResponse.json(
      { message: authError.message || "Não foi possível criar a conta." },
      { status: 400 }
    );
  }

  const userId = authData.user.id;

  await supabase.from("profiles").upsert({
    id: userId,
    role: "patient",
    full_name: body.fullName,
    phone: phoneNormalized,
    email: body.email
  });

  let patientId = patientToLink?.id;
  let waitlistId = patientToLink?.waitlist_id || null;

  if (patientId) {
    const { error: updateError } = await supabase
      .from("patients")
      .update({
        user_id: userId,
        cpf: body.cpf,
        cpf_hash: hashCpf(body.cpf),
        full_name: body.fullName,
        phone: phoneNormalized,
        goal: body.goal,
        updated_at: new Date().toISOString()
      })
      .eq("id", patientId);

    if (updateError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ message: "Erro ao vincular paciente." }, { status: 500 });
    }

    if (patientToLink.waitlist_id) {
      waitlistId = patientToLink.waitlist_id;
      await supabase
        .from("waitlist")
        .update({ converted_patient_id: patientId })
        .eq("id", patientToLink.waitlist_id);
    } else {
      const waitlistEntry = await ensureWaitlistEntry(supabase, {
        fullName: body.fullName,
        phone: phoneNormalized,
        goal: body.goal
      });
      waitlistId = waitlistEntry.id;
      await supabase
        .from("patients")
        .update({ waitlist_id: waitlistId })
        .eq("id", patientId);
      await supabase
        .from("waitlist")
        .update({ converted_patient_id: patientId })
        .eq("id", waitlistId);
    }
  } else {
    const waitlistEntry = await ensureWaitlistEntry(supabase, {
      fullName: body.fullName,
      phone: phoneNormalized,
      goal: body.goal
    });
    waitlistId = waitlistEntry.id;

    const { data: createdPatient, error: patientError } = await supabase
      .from("patients")
      .insert({
        cpf: body.cpf,
        cpf_hash: hashCpf(body.cpf),
        full_name: body.fullName,
        phone: phoneNormalized,
        goal: body.goal,
        user_id: userId,
        waitlist_id: waitlistId,
        source: "signup"
      })
      .select("id")
      .single();

    if (patientError) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ message: "Erro ao vincular paciente." }, { status: 500 });
    }
    patientId = createdPatient.id;

    await supabase
      .from("waitlist")
      .update({ converted_patient_id: patientId })
      .eq("id", waitlistId);
  }

  if (waitlistId) {
    try {
      await syncWaitlistPatient(supabase, {
        waitlistId,
        fullName: body.fullName,
        phone: phoneNormalized,
        goal: body.goal
      });
    } catch (syncError) {
      console.error("Waitlist sync after signup failed:", syncError);
    }
  }

  await supabase.from("consent_records").insert([
    {
      patient_id: patientId,
      consent_type: "privacy_and_health_data",
      version: PRIVACY_POLICY_VERSION
    },
    {
      patient_id: patientId,
      consent_type: "terms_of_use",
      version: TERMS_VERSION
    }
  ]);

  await writeAuditLog({
    actorId: userId,
    action: "signup",
    resourceType: "patient",
    resourceId: patientId,
    ip
  });

  const waitlist = waitlistId
    ? await getWaitlistStatus(supabase, { waitlistId })
    : await getWaitlistStatus(supabase, { phone: phoneNormalized });

  return NextResponse.json({
    ok: true,
    patientId,
    waitlist: waitlist.found ? waitlist : null
  });
}
