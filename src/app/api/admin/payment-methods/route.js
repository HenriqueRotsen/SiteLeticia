import { NextResponse } from "next/server";
import { requireNutritionist } from "@/lib/auth";
import { paymentMethodSchema } from "@/lib/validation/schemas";

export async function GET() {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { data } = await auth.ctx.supabase
    .from("payment_methods")
    .select("*")
    .order("sort_order", { ascending: true });

  return NextResponse.json({ methods: data || [] });
}

export async function POST(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  let body;
  try {
    body = paymentMethodSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  }

  const { data, error } = await auth.ctx.supabase
    .from("payment_methods")
    .insert({
      type: body.type,
      label: body.label,
      details: body.details,
      active: body.active,
      sort_order: body.sortOrder
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao salvar." }, { status: 500 });
  return NextResponse.json({ method: data });
}

export async function PATCH(request) {
  const auth = await requireNutritionist();
  if (auth.error) return auth.error;

  const { id, ...rest } = await request.json();
  if (!id) return NextResponse.json({ message: "ID obrigatório." }, { status: 400 });

  const { data, error } = await auth.ctx.supabase
    .from("payment_methods")
    .update({
      type: rest.type,
      label: rest.label,
      details: rest.details,
      active: rest.active,
      sort_order: rest.sortOrder
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ message: "Erro ao atualizar." }, { status: 500 });
  return NextResponse.json({ method: data });
}
