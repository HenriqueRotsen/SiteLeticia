import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

const allowedGoals = [
  "Emagrecimento",
  "Cirurgia Bariátrica",
  "Saúde intestinal",
  "Medicina de precisão",
  "Nutrição clínica",
  "Hipertrofia"
];

function onlyNumbers(value = "") {
  return value.replace(/\D/g, "");
}

function isDuplicatePhone(error) {
  return error?.code === "23505" || error?.message?.toLowerCase().includes("duplicate");
}

async function verifyRecaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return {
      ok: false,
      message: "reCAPTCHA ainda não configurado no servidor."
    };
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
  const phone = onlyNumbers(rawPhone);
  const cleanName = fullName?.trim();

  if (!cleanName || phone.length < 10 || !allowedGoals.includes(goal)) {
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

  const { error } = await supabase.from("waitlist").insert({
    full_name: cleanName,
    phone,
    goal
  });

  if (error) {
    return NextResponse.json(
      {
        message: isDuplicatePhone(error)
          ? "Esse WhatsApp já está na lista. Use a aba de consulta para acompanhar sua posição."
          : "Não foi possível concluir o cadastro agora. Tente novamente em alguns instantes."
      },
      { status: isDuplicatePhone(error) ? 409 : 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
