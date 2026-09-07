import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { maskCpf } from "@/lib/cpf";
import { writeAuditLog, getClientIp } from "@/lib/audit";

export async function GET(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const q = new URL(request.url).searchParams.get("q")?.trim();

  let query = auth.ctx.supabase
    .from("patients")
    .select("id, full_name, phone, goal, cpf, user_id, source, waitlist_id, created_at")
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ message: "Erro ao listar." }, { status: 500 });

  await writeAuditLog({
    actorId: auth.ctx.user.id,
    action: "patients_list",
    resourceType: "patients",
    resourceId: null,
    ip: getClientIp(request)
  });

  return NextResponse.json({
    patients: (data || []).map((p) => ({
      ...p,
      cpf_masked: maskCpf(p.cpf),
      cpf: undefined,
      has_account: Boolean(p.user_id),
      from_waitlist: p.source === "waitlist" || Boolean(p.waitlist_id)
    }))
  });
}

export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const body = await request.json();
  const { hashCpf, normalizeCpf, isValidCpf } = await import("@/lib/cpf");

  const phone = String(body.phone).replace(/\D/g, "");
  if (!body.fullName?.trim() || !phone || !body.goal) {
    return NextResponse.json({ message: "Nome, telefone e objetivo são obrigatórios." }, { status: 400 });
  }

  let cpf = null;
  let cpfHash = null;
  if (body.cpf) {
    if (!isValidCpf(body.cpf)) {
      return NextResponse.json({ message: "CPF inválido." }, { status: 400 });
    }
    cpf = normalizeCpf(body.cpf);
    cpfHash = hashCpf(cpf);
  }

  const { data, error } = await auth.ctx.supabase
    .from("patients")
    .insert({
      cpf,
      cpf_hash: cpfHash,
      full_name: body.fullName.trim(),
      phone,
      goal: body.goal,
      source: "admin"
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const message = error.message?.includes("phone")
        ? "Telefone já cadastrado."
        : "CPF já cadastrado.";
      return NextResponse.json({ message }, { status: 409 });
    }
    return NextResponse.json({ message: "Erro ao criar paciente." }, { status: 500 });
  }

  return NextResponse.json({ patient: data });
}
