import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GOALS } from "@/lib/constants";
import { antiSpamDecision, verifyRecaptcha } from "@/lib/waitlist/antispam";
import { getClientIp } from "@/lib/audit";
import {
  computeWaitlistPosition,
  getWaitlistEntryByPhone,
  getWaitlistStatus,
  normalizeWaitlistPhone,
  syncWaitlistPatient
} from "@/lib/waitlist/position";

// Quem tenta se cadastrar de novo com o mesmo WhatsApp mantém a posição original.
function alreadyRegisteredResponse(entry, status) {
  const since = entry?.created_at
    ? new Date(entry.created_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null;
  const message =
    status.status === "called"
      ? status.message
      : `Esse WhatsApp já estava na lista${since ? ` desde ${since}` : ""}, então a posição é a do primeiro cadastro.`;
  return NextResponse.json(
    { ...status, alreadyRegistered: true, joinedAt: entry?.created_at || null, message },
    { status: 409 }
  );
}

function isDuplicatePhone(error) {
  return error?.code === "23505" || error?.message?.toLowerCase().includes("duplicate");
}

export async function POST(request) {
  const { fullName, phone: rawPhone, goal, recaptchaToken, website, elapsedMs } = await request.json();
  const phone = normalizeWaitlistPhone(rawPhone);
  const cleanName = fullName?.trim();

  if (!cleanName || phone.length < 10 || !GOALS.includes(goal)) {
    return NextResponse.json(
      { message: "Preencha nome completo, WhatsApp com DDD e objetivo." },
      { status: 400 }
    );
  }

  const recaptcha = await verifyRecaptcha(recaptchaToken);
  const decision = antiSpamDecision({
    recaptcha,
    honeypot: typeof website === "string" && website.trim() !== "",
    elapsedMs: Number.isFinite(Number(elapsedMs)) ? Number(elapsedMs) : undefined,
    ip: getClientIp(request) || "unknown"
  });

  // Registro sem dados pessoais, para entender recusas e notas baixas.
  if (!decision.ok || recaptcha.status !== "pass") {
    console.warn(
      "[waitlist-antispam]",
      JSON.stringify({ allowed: decision.ok, block: decision.reason || null, recaptcha: recaptcha.reason, ...recaptcha.details })
    );
  }

  if (!decision.ok) {
    return NextResponse.json(
      {
        message:
          "Não conseguimos confirmar o cadastro agora. Aguarde alguns segundos e tente de novo, ou fale com a Letícia pelo WhatsApp."
      },
      { status: 400 }
    );
  }

  let supabase;

  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Supabase admin não configurado no servidor." },
      { status: 500 }
    );
  }

  const existing = await getWaitlistEntryByPhone(supabase, phone);

  if (existing) {
    const status = await getWaitlistStatus(supabase, { waitlistId: existing.id });
    return alreadyRegisteredResponse(existing, status);
  }

  const { data: inserted, error } = await supabase
    .from("waitlist")
    .insert({
      full_name: cleanName,
      phone,
      goal
    })
    .select("id, full_name, phone, goal, status, created_at")
    .single();

  if (error) {
    if (isDuplicatePhone(error)) {
      const duplicate = await getWaitlistEntryByPhone(supabase, phone);
      const status = duplicate
        ? await getWaitlistStatus(supabase, { waitlistId: duplicate.id })
        : { found: false };
      return alreadyRegisteredResponse(duplicate, status);
    }

    return NextResponse.json(
      { message: "Não foi possível concluir o cadastro agora. Tente novamente em alguns instantes." },
      { status: 500 }
    );
  }

  try {
    await syncWaitlistPatient(supabase, {
      waitlistId: inserted.id,
      fullName: cleanName,
      phone,
      goal
    });
  } catch (syncError) {
    console.error("Waitlist patient sync failed:", syncError);
  }

  const position = await computeWaitlistPosition(supabase, inserted.id);

  return NextResponse.json({
    ok: true,
    status: "waiting",
    position,
    waitlistId: inserted.id,
    message: "Cadastro realizado com sucesso. Guarde sua posição na fila."
  });
}
