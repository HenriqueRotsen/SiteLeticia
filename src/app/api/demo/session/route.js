import { NextResponse } from "next/server";
import { DEMO_ROLE_COOKIE } from "@/lib/demo/config";

import { isDemoMode } from "@/lib/demo/config";

export async function POST(request) {
  if (!isDemoMode()) {
    return NextResponse.json({ message: "Modo demo desativado." }, { status: 403 });
  }
  const { role } = await request.json();

  if (!["patient", "nutritionist"].includes(role)) {
    return NextResponse.json({ message: "Perfil demo inválido." }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true, role });
  response.cookies.set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}

export async function DELETE() {
  if (!isDemoMode()) {
    return NextResponse.json({ message: "Modo demo desativado." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_ROLE_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
