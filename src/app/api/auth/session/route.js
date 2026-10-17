import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/auth";
import { DEMO_ROLE_COOKIE, isDemoMode } from "@/lib/demo/config";

function homeForRole(role) {
  return role === "nutritionist" ? "/admin" : "/app";
}

export async function GET() {
  if (isDemoMode()) {
    const jar = await cookies();
    const role = jar.get(DEMO_ROLE_COOKIE)?.value || null;
    if (!role) {
      return NextResponse.json({ authenticated: false, role: null, homePath: null, label: null });
    }
    return NextResponse.json({
      authenticated: true,
      role,
      homePath: homeForRole(role),
      label: role === "nutritionist" ? "Área da nutricionista" : "Minha área"
    });
  }

  const ctx = await getAuthContext();
  if (!ctx.user) {
    return NextResponse.json({ authenticated: false, role: null, homePath: null, label: null });
  }

  const role = ctx.profile?.role === "nutritionist" ? "nutritionist" : "patient";
  return NextResponse.json({
    authenticated: true,
    role,
    homePath: homeForRole(role),
    label: role === "nutritionist" ? "Área da nutricionista" : "Minha área"
  });
}
