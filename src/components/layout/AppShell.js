"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, LogOut, Menu, User, X } from "lucide-react";
import NotificationBell from "@/components/ui/NotificationBell";

function NavItem({ href, label, icon: Icon, onNavigate }) {
  const pathname = usePathname();
  const exactOnly = href === "/admin" || href === "/app";
  const active =
    pathname === href ||
    (!exactOnly && href.length > 1 && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-olive-100 text-olive-900"
          : "text-graphite/60 hover:bg-porcelain hover:text-graphite"
      }`}
    >
      {Icon ? <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} /> : null}
      <span className="truncate">{label}</span>
    </Link>
  );
}

function UserAvatar({ name, size = "md" }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const sizeClass =
    size === "sm"
      ? "h-8 w-8 text-[11px] ring-[1.5px]"
      : "h-9 w-9 text-xs ring-2";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-olive-600 to-olive-800 font-semibold text-white ring-olive-100 ${sizeClass}`}
    >
      {initials}
    </div>
  );
}

function UserProfileChip({ name, href, label = "Meu perfil", active = false }) {
  const content = (
    <>
      <UserAvatar name={name} />
      <div className="min-w-0">
        <p className="max-w-[7.5rem] truncate text-sm font-semibold text-graphite sm:max-w-[11rem]">
          {name}
        </p>
        <p className="flex items-center gap-1 text-[11px] text-graphite/50 sm:text-xs">
          <User className="h-3 w-3 shrink-0" strokeWidth={2} />
          <span>{label}</span>
        </p>
      </div>
      <ChevronRight
        className={`hidden h-4 w-4 shrink-0 text-graphite/30 transition sm:block ${
          active ? "text-olive-700/70" : "group-hover:translate-x-0.5 group-hover:text-olive-700/60"
        }`}
        strokeWidth={2}
      />
    </>
  );

  const className = `group flex min-w-0 items-center gap-2.5 rounded-2xl border px-2 py-1.5 transition sm:gap-3 sm:px-3 sm:py-2 ${
    active
      ? "border-olive-300/40 bg-olive-50/80 shadow-sm"
      : "border-olive-900/10 bg-white/80 hover:border-olive-300/35 hover:bg-white hover:shadow-sm"
  }`;

  if (!href) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className} aria-label={`${label}: ${name}`}>
      {content}
    </Link>
  );
}

function SidebarBrand() {
  return (
    <div className="flex items-center gap-3 border-b border-olive-900/10 px-5 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-olive-700 text-sm font-bold text-white shadow-sm">
        LC
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-graphite">Letícia Cunha</p>
        <p className="text-xs text-graphite/45">Plataforma</p>
      </div>
    </div>
  );
}

function NavSections({ sections, onNavigate }) {
  return (
    <nav className="space-y-6">
      {sections.map((section) => (
        <div key={section.label || "main"}>
          {section.label ? (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-graphite/40">
              {section.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {section.items.map((item) => (
              <NavItem key={item.href} {...item} onNavigate={onNavigate} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function AppShell({
  title,
  breadcrumbs = [],
  navSections = [],
  children,
  userName,
  profileHref,
  profileLabel = "Meu perfil",
  onLogout,
  subtitle
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const flatNav = useMemo(() => navSections.flatMap((section) => section.items), [navSections]);
  const mobileNav = flatNav.slice(0, 4);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="min-h-[100dvh] w-full bg-linen text-graphite">
      <aside
        className="fixed bottom-0 left-0 top-[var(--demo-banner-height,0px)] z-30 hidden w-[272px] flex-col border-r border-olive-900/10 bg-porcelain/95 lg:flex"
        style={{ height: "calc(100dvh - var(--demo-banner-height, 0px))" }}
      >
        <SidebarBrand />
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavSections sections={navSections} />
        </div>
        <div className="border-t border-olive-900/10 p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-graphite/60 transition hover:bg-porcelain hover:text-graphite"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            Sair
          </button>
        </div>
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-graphite/40 backdrop-blur-[2px]"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute bottom-0 left-0 top-[var(--demo-banner-height,0px)] flex w-[min(100%,320px)] flex-col bg-porcelain shadow-soft"
            style={{ height: "calc(100dvh - var(--demo-banner-height, 0px))" }}
          >
            <div className="flex items-center justify-between border-b border-olive-900/10 px-4 py-4">
              <p className="font-semibold text-graphite">Menu</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-olive-900/10 text-graphite/60"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavSections sections={navSections} onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="border-t border-olive-900/10 p-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-graphite/60"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
                Sair
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-[100dvh] w-full min-w-0 flex-col lg:pl-[272px]">
        <header className="sticky top-[var(--demo-banner-height,0px)] z-20 border-b border-olive-900/10 bg-porcelain/90 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-olive-900/10 bg-white text-graphite/70 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                {breadcrumbs.length ? (
                  <nav className="mb-1 flex flex-wrap items-center gap-1 text-xs text-graphite/45">
                    {breadcrumbs.map((crumb, index) => (
                      <span key={`${crumb}-${index}`} className="flex items-center gap-1">
                        {index > 0 ? <ChevronRight className="h-3 w-3 shrink-0" /> : null}
                        <span className={index === breadcrumbs.length - 1 ? "text-graphite/70" : ""}>
                          {crumb}
                        </span>
                      </span>
                    ))}
                  </nav>
                ) : null}
                <h1 className="truncate text-lg font-semibold tracking-tight text-graphite sm:text-2xl">{title}</h1>
                {subtitle ? <p className="mt-0.5 line-clamp-2 text-sm text-graphite/55">{subtitle}</p> : null}
              </div>
            </div>

            <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:gap-3">
              <NotificationBell />
              <UserProfileChip
                name={userName}
                href={profileHref}
                label={profileLabel}
                active={Boolean(profileHref && pathname.startsWith(profileHref))}
              />
            </div>
          </div>
        </header>

        <main className="w-full flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:pb-8">{children}</main>

        {mobileNav.length ? (
          <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-olive-900/10 bg-porcelain/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md lg:hidden">
            <ul className="grid grid-cols-4 gap-1">
              {mobileNav.map((item) => {
                const Icon = item.icon;
                const exactOnly = item.href === "/admin" || item.href === "/app";
                const active =
                  pathname === item.href ||
                  (!exactOnly && item.href.length > 1 && pathname.startsWith(`${item.href}/`));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium leading-none ${
                        active ? "bg-olive-100 text-olive-800" : "text-graphite/55"
                      }`}
                    >
                      {Icon ? <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /> : null}
                      <span className="truncate max-w-full">{item.label.split(" ")[0]}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </div>
  );
}

export function Card({ children, className = "", title, action }) {
  return (
    <section
      className={`rounded-2xl border border-olive-900/10 bg-porcelain/95 p-5 shadow-card sm:p-6 ${className}`}
    >
      {title ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-graphite">{title}</h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function TableShell({ children }) {
  return <div className="-mx-1 overflow-x-auto">{children}</div>;
}

export function DataTable({ columns, rows, emptyMessage = "Nenhum registro." }) {
  if (!rows?.length) {
    return <p className="py-8 text-center text-sm text-graphite/45">{emptyMessage}</p>;
  }

  return (
    <TableShell>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-olive-900/10 text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-graphite/45"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-olive-900/5">
          {rows.map((row) => (
            <tr key={row.id} className="group transition hover:bg-linen/70">
              {columns.map((col) => (
                <td key={col.key} className="py-3.5 pr-4 text-graphite/70">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

export function inputClassName(extra = "") {
  return `w-full rounded-xl border border-olive-900/10 bg-white px-4 py-2.5 text-sm text-graphite outline-none transition placeholder:text-graphite/40 focus:border-olive-500 focus:ring-2 focus:ring-olive-100 ${extra}`;
}

export function btnPrimary(extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl bg-olive-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-olive-800 focus:outline-none focus:ring-2 focus:ring-olive-200 disabled:opacity-60 ${extra}`;
}

export function btnSecondary(extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-xl border border-olive-900/10 bg-white px-4 py-2.5 text-sm font-semibold text-graphite/80 transition hover:bg-linen focus:outline-none focus:ring-2 focus:ring-olive-100 disabled:opacity-60 ${extra}`;
}

export function formatCurrency(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format((cents || 0) / 100);
}
