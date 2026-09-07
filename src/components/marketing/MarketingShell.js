"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks, site } from "@/lib/marketing/content";

function NavLink({ href, label, onClick }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-xs font-semibold uppercase tracking-[0.18em] transition ${
        active ? "text-olive-800" : "text-graphite/55 hover:text-olive-800"
      }`}
    >
      {label}
    </Link>
  );
}

export default function MarketingShell({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b border-olive-900/8 bg-porcelain/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
          <Link href="/" className="group">
            <p className="font-display text-xl leading-snug text-graphite transition group-hover:text-olive-800">
              {site.name}
            </p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-graphite/45">
              {site.domain}
            </p>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/entrar"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60 transition hover:text-olive-800"
            >
              Entrar
            </Link>
            <Link
              href="/criar-conta"
              className="interactive-lift rounded-full bg-graphite px-5 py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-porcelain transition hover:bg-olive-800"
            >
              Criar conta
            </Link>
          </div>

          <button
            type="button"
            className="rounded-full border border-olive-900/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-graphite lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label="Abrir menu"
          >
            Menu
          </button>
        </div>

        {open ? (
          <div className="border-t border-olive-900/8 bg-porcelain px-5 py-5 lg:hidden">
            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <NavLink key={link.href} {...link} onClick={() => setOpen(false)} />
              ))}
              <Link
                href="/entrar"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-graphite/60"
              >
                Entrar
              </Link>
              <Link
                href="/criar-conta"
                onClick={() => setOpen(false)}
                className="rounded-full bg-graphite px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-porcelain"
              >
                Criar conta
              </Link>
            </nav>
          </div>
        ) : null}
      </header>

      {children}

      <footer className="border-t border-olive-900/10 bg-graphite text-porcelain">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <p className="font-display text-3xl">{site.name}</p>
            <p className="mt-3 max-w-sm text-sm leading-7 text-porcelain/70">
              Nutrição clínica, bariátrica e de precisão. Ciência, acolhimento e estratégias possíveis para a sua
              rotina.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-porcelain/45">Navegação</p>
            <ul className="mt-4 space-y-2 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-porcelain/75 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/fila-de-espera" className="text-porcelain/75 transition hover:text-white">
                  Lista de espera
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-porcelain/45">Legal</p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="/privacidade" className="text-porcelain/75 transition hover:text-white">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-porcelain/75 transition hover:text-white">
                  Termos
                </Link>
              </li>
              <li>
                <Link href="/contato" className="text-porcelain/75 transition hover:text-white">
                  Contato
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-porcelain/45 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>© {new Date().getFullYear()} {site.name}. Todos os direitos reservados.</p>
            <p>{site.city}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function SectionEyebrow({ children, className = "", tone = "default" }) {
  const toneClass = tone === "inverse" ? "text-porcelain/70" : "text-olive-700";

  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${toneClass} ${className}`}
    >
      {children}
    </p>
  );
}

export function PageHero({ eyebrow, title, description, children }) {
  return (
    <section className="border-b border-olive-900/8 bg-white/35">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <SectionEyebrow>{eyebrow}</SectionEyebrow>
        <h1 className="mt-5 max-w-4xl font-display text-4xl leading-[1.05] text-graphite sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite/70">{description}</p>
        ) : null}
        {children}
      </div>
    </section>
  );
}
