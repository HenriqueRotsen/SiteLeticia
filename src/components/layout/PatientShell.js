"use client";

import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  Camera,
  FlaskConical,
  LayoutDashboard,
  LineChart,
  Salad,
  Stethoscope,
  User
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { isPublicDemoMode } from "@/lib/demo/config-public";
import { resetPatientProfileCache, usePatientProfile } from "@/lib/hooks/usePatientProfile";

const navSections = [
  {
    label: "Meu acompanhamento",
    items: [
      { href: "/app", label: "Início", icon: LayoutDashboard },
      { href: "/app/dieta", label: "Dieta", icon: Salad },
      { href: "/app/exames", label: "Exames", icon: FlaskConical },
      { href: "/app/fotos", label: "Fotos", icon: Camera },
      { href: "/app/evolucao", label: "Evolução", icon: LineChart }
    ]
  },
  {
    label: "Consultas",
    items: [
      { href: "/app/agenda", label: "Agendar", icon: CalendarPlus },
      { href: "/app/consultas", label: "Minhas consultas", icon: Stethoscope }
    ]
  },
  {
    label: "Conta",
    items: [{ href: "/app/perfil", label: "Meu perfil", icon: User }]
  }
];

export default function PatientShell({ title, breadcrumbs, userName: userNameOverride, subtitle, children }) {
  const router = useRouter();
  const { fullName, loading } = usePatientProfile();
  const userName = userNameOverride || fullName || (loading ? "Carregando..." : "Paciente");

  async function logout() {
    resetPatientProfileCache();
    if (isPublicDemoMode()) {
      await fetch("/api/demo/session", { method: "DELETE" });
      router.push("/demo");
      return;
    }
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/entrar");
  }

  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      breadcrumbs={breadcrumbs}
      userName={userName}
      profileHref="/app/perfil"
      profileLabel="Meu perfil"
      onLogout={logout}
      navSections={navSections}
    >
      {children}
    </AppShell>
  );
}
