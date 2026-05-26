import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/adminAuth";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

function unauthorized() {
  return NextResponse.json({ message: "Sessão admin inválida." }, { status: 401 });
}

function getSession(request) {
  return request.cookies.get(ADMIN_COOKIE_NAME)?.value;
}

export async function GET(request) {
  if (!verifyAdminSession(getSession(request))) return unauthorized();

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Chave service_role do Supabase não configurada." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("waitlist")
    .select("id, full_name, phone, goal, status, created_at")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível carregar a lista." },
      { status: 500 }
    );
  }

  return NextResponse.json({ waitlist: data });
}

export async function PATCH(request) {
  if (!verifyAdminSession(getSession(request))) return unauthorized();

  const { id, status } = await request.json();

  if (!id || !["waiting", "called"].includes(status)) {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Chave service_role do Supabase não configurada." },
      { status: 500 }
    );
  }

  const { error } = await supabase.from("waitlist").update({ status }).eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível atualizar o cadastro." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  if (!verifyAdminSession(getSession(request))) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createSupabaseAdmin();
  } catch {
    return NextResponse.json(
      { message: "Chave service_role do Supabase não configurada." },
      { status: 500 }
    );
  }

  const { error } = await supabase.from("waitlist").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível remover o cadastro." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
