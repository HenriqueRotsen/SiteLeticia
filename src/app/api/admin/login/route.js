import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, createAdminSession, getAdminCookieOptions } from "@/lib/adminAuth";

export async function POST(request) {
  const { username, password } = await request.json();
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    return NextResponse.json(
      { message: "Login admin ainda não configurado no ambiente." },
      { status: 500 }
    );
  }

  if (username !== adminUsername || password !== adminPassword) {
    return NextResponse.json(
      { message: "Usuário ou senha inválidos." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    ADMIN_COOKIE_NAME,
    createAdminSession(username),
    getAdminCookieOptions()
  );

  return response;
}
