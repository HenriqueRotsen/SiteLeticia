"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarClock,
  CircleDollarSign,
  CreditCard,
  FlaskConical,
  LayoutDashboard,
  Library,
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
      { href: "/admin/exames", label: "Exames pendentes", icon: FlaskConical },
      { href: "/admin/financeiro", label: "Financeiro", icon: CircleDollarSign }
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
      { href: "/admin/configuracoes/presets", label: "Presets", icon: Library },
      { href: "/admin/configuracoes/pagamento", label: "Pagamento", icon: CreditCard },
      { href: "/admin/configuracoes/integracoes", label: "Integrações", icon: Link2 }
    ]
  }
];

const ADMIN_CRUMB_HREFS = {
  Admin: "/admin",
  Dashboard: "/admin",
  Pacientes: "/admin/pacientes",
  Consultas: "/admin/consultas",
  Detalhe: null,
  Financeiro: "/admin/financeiro",
  "Exames pendentes": "/admin/exames",
  Exames: "/admin/exames",
  Agenda: "/admin/agenda",
  Disponibilidade: "/admin/agenda/disponibilidade",
  Configurações: "/admin/configuracoes/presets",
  Presets: "/admin/configuracoes/presets",
  Pagamento: "/admin/configuracoes/pagamento",
  Integrações: "/admin/configuracoes/integracoes"
};

function resolveAdminBreadcrumbs(breadcrumbs = []) {
  return breadcrumbs.map((crumb, index) => {
    const isLast = index === breadcrumbs.length - 1;

    if (typeof crumb === "object" && crumb) {
      return {
        label: crumb.label,
        href: crumb.href || null
      };
    }

    return {
      label: crumb,
      href: isLast ? null : ADMIN_CRUMB_HREFS[crumb] || null
    };
  });
}

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
      breadcrumbs={resolveAdminBreadcrumbs(breadcrumbs)}
      userName={userName}
      onLogout={logout}
      navSections={navSections}
    >
      {children}
    </AppShell>
  );
}
