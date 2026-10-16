import { NextResponse } from "next/server";
import { requirePatient } from "@/lib/auth";
import { writeAuditLog, getClientIp } from "@/lib/audit";
import {
  getLatestMeasurement,
  mapPatientProfileDbError,
  mapPatientProfileResponse
} from "@/lib/patients/profile";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getWaitlistStatus } from "@/lib/waitlist/position";
import { patientProfileUpdateSchema } from "@/lib/validation/schemas";

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeZip(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits || null;
}

function normalizeState(value) {
  const state = String(value || "")
    .trim()
    .toUpperCase();
  return state || null;
}

function normalizeOptionalText(value) {
  const text = String(value || "").trim();
  return text || null;
}

async function loadPatientProfile(authCtx) {
  const { patient, profile, user } = authCtx;
  let waitlist = null;
  let latestMeasurement = null;

  try {
    const supabase = createSupabaseAdmin();
    latestMeasurement = await getLatestMeasurement(supabase, patient.id);
    waitlist = await getWaitlistStatus(supabase, {
      waitlistId: patient.waitlist_id,
      phone: patient.phone
    });
  } catch (error) {
    console.error("Patient profile load failed:", error);
  }

  return {
    patient: mapPatientProfileResponse(patient, latestMeasurement),
    profile: profile
      ? {
          email: profile.email || user.email || null,
          full_name: profile.full_name
        }
      : { email: user.email || null, full_name: patient.full_name },
    waitlist: waitlist?.found ? waitlist : null
  };
}

export async function GET() {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  return NextResponse.json(await loadPatientProfile(auth.ctx));
}

export async function PATCH(request) {
  const auth = await requirePatient();
  if (auth.error) return auth.error;

  let body;
  try {
    body = patientProfileUpdateSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados de perfil inválidos." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json({ message: "Supabase admin não configurado." }, { status: 503 });
  }

  const { patient, user } = auth.ctx;
  const updates = {
    updated_at: new Date().toISOString()
  };

  if (body.fullName !== undefined) updates.full_name = body.fullName.trim();
  if (body.phone !== undefined) updates.phone = normalizePhone(body.phone);
  if (body.goal !== undefined) updates.goal = body.goal;
  if (body.sex !== undefined) updates.sex = body.sex;
  if (body.birthDate !== undefined) updates.birth_date = body.birthDate;
  if (body.heightCm !== undefined) updates.height_cm = body.heightCm;
  if (body.bodyFatPercent !== undefined) updates.body_fat_percent = body.bodyFatPercent;
  if (body.activityLevel !== undefined) updates.activity_level = body.activityLevel;
  if (body.addressStreet !== undefined) {
    updates.address_street = normalizeOptionalText(body.addressStreet);
  }
  if (body.addressNumber !== undefined) {
    updates.address_number = normalizeOptionalText(body.addressNumber);
  }
  if (body.addressComplement !== undefined) {
    updates.address_complement = normalizeOptionalText(body.addressComplement);
  }
  if (body.addressNeighborhood !== undefined) {
    updates.address_neighborhood = normalizeOptionalText(body.addressNeighborhood);
  }
  if (body.addressCity !== undefined) updates.address_city = normalizeOptionalText(body.addressCity);
  if (body.addressState !== undefined) updates.address_state = normalizeState(body.addressState);
  if (body.addressZip !== undefined) updates.address_zip = normalizeZip(body.addressZip);

  const { data: updatedPatient, error } = await supabase
    .from("patients")
    .update(updates)
    .eq("id", patient.id)
    .select("*")
    .single();

  if (error || !updatedPatient) {
    console.error("Patient profile PATCH failed:", error);
    return NextResponse.json({ message: mapPatientProfileDbError(error) }, { status: 500 });
  }

  if (body.weightKg != null) {
    const { error: weightError } = await supabase.from("body_measurements").insert({
      patient_id: patient.id,
      weight_kg: body.weightKg,
      recorded_at: new Date().toISOString()
    });

    if (weightError) {
      console.error("Weight measurement insert failed:", weightError);
      return NextResponse.json(
        { message: "Perfil salvo, mas não foi possível registrar o peso." },
        { status: 500 }
      );
    }
  }

  if (body.fullName !== undefined) {
    await supabase
      .from("profiles")
      .update({ full_name: body.fullName.trim(), updated_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  const latestMeasurement = await getLatestMeasurement(supabase, patient.id);

  await writeAuditLog({
    actorId: user.id,
    action: "patient_profile_update",
    resourceType: "patient",
    resourceId: patient.id,
    ip: getClientIp(request)
  });

  const payload = await loadPatientProfile({
    ...auth.ctx,
    patient: updatedPatient
  });

  return NextResponse.json({
    patient: payload.patient,
    profile: payload.profile,
    waitlist: payload.waitlist
  });
}
