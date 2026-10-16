import { NextResponse } from "next/server";
import { lookupBarcode } from "@/lib/foods/search";
import { requireAuth } from "@/lib/auth";

export async function GET(_request, { params }) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const product = await lookupBarcode(params.code);
  if (!product) return NextResponse.json({ message: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ product });
}
