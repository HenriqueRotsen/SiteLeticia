"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarClock,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Link2,
  Stethoscope,
  Users
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { isPublicDemoMode } from "@/lib/demo/config-public";

const navSections = [
  {
    label: "Principal",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/pacientes", label: "Pacientes", icon: Users },
      { href: "/admin/consultas", label: "Consultas", icon: Stethoscope },
      { href: "/admin/exames", label: "Exames pendentes", icon: FlaskConical }
    ]
  },
  {
    label: "Agenda",
    items: [
      { href: "/admin/agenda", label: "Calendário", icon: Calendar },
      { href: "/admin/agenda/disponibilidade", label: "Disponibilidade", icon: CalendarClock }
    ]
  },
  {
    label: "Configurações",
    items: [
      { href: "/admin/configuracoes/pagamento", label: "Pagamento", icon: CreditCard },
      { href: "/admin/configuracoes/integracoes", label: "Integrações", icon: Link2 }
    ]
  }
];

export default function AdminShell({ title, breadcrumbs, userName, subtitle, children }) {
  const router = useRouter();

  async function logout() {
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
      onLogout={logout}
      navSections={navSections}
    >
      {children}
    </AppShell>
  );
}
