import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GOALS } from "@/lib/constants";
import {
  computeWaitlistPosition,
  getWaitlistEntryByPhone,
  getWaitlistStatus,
  normalizeWaitlistPhone,
  syncWaitlistPatient
} from "@/lib/waitlist/position";

function isDuplicatePhone(error) {
  return error?.code === "23505" || error?.message?.toLowerCase().includes("duplicate");
}

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return { ok: true };
  }

  if (!token) {
    return {
      ok: false,
      message: "Não foi possível validar a proteção anti-spam."
    };
  }

  const params = new URLSearchParams({
    secret,
    response: token
  });

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });
  const result = await response.json();

  if (!result.success || result.score < 0.5 || result.action !== "waitlist_signup") {
    return {
      ok: false,
      message: "Cadastro bloqueado pela proteção anti-spam. Tente novamente."
    };
  }

  return { ok: true };
}

export async function POST(request) {
  const { fullName, phone: rawPhone, goal, recaptchaToken } = await request.json();
  const phone = normalizeWaitlistPhone(rawPhone);
  const cleanName = fullName?.trim();

  if (!cleanName || phone.length < 10 || !GOALS.includes(goal)) {
    return NextResponse.json(
      { message: "Preencha nome completo, WhatsApp com DDD e objetivo." },
      { status: 400 }
    );
  }

  const recaptcha = await verifyRecaptcha(recaptchaToken);

  if (!recaptcha.ok) {
    return NextResponse.json({ message: recaptcha.message }, { status: 400 });
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

    return NextResponse.json(
      {
        message: "Esse WhatsApp já está na lista. Confira sua posição abaixo.",
        ...status
      },
      { status: 409 }
    );
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

      return NextResponse.json(
        {
          message: "Esse WhatsApp já está na lista. Confira sua posição abaixo.",
          ...status
        },
        { status: 409 }
      );
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
