"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandWordmark, LcMonogram } from "@/components/brand/BrandMark";
import { BookingProvider, useBooking } from "@/components/marketing/BookingDialog";
import { instagramLink, navLinks, site, whatsappLink } from "@/lib/marketing/content";

function WhatsappIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className} fill="currentColor">
      <path d="M16.04 3C9.4 3 4 8.38 4 15.01c0 2.12.56 4.19 1.62 6.01L4 29l8.17-1.6a12.03 12.03 0 0 0 3.87.63h.01C22.7 28.03 28 22.64 28 16.02 28 9.38 22.68 3 16.04 3Zm0 22.02h-.01c-1.17 0-2.32-.3-3.33-.88l-.24-.14-4.85.95.98-4.72-.16-.25a9.95 9.95 0 0 1-1.54-5.3c0-5.5 4.5-9.97 10.06-9.97 5.55 0 9.98 4.47 9.98 9.98 0 5.5-4.5 10.33-8.9 10.33Zm5.5-7.45c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.38-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.7.22 1.35.19 1.86.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

/** Botão de destaque "Marque uma consulta": abre o pop-up (agenda ou WhatsApp). */
export function BookingButton({ className = "", variant = "gold", children = "Marque uma consulta" }) {
  const { open } = useBooking();
  const styles =
    variant === "dark"
      ? "bg-graphite text-porcelain hover:bg-olive-800"
      : "bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-[0_14px_34px_rgba(165,125,78,0.35)] hover:shadow-[0_18px_42px_rgba(165,125,78,0.5)]";

  return (
    <button
      type="button"
      onClick={open}
      className={`btn-shine interactive-lift inline-flex items-center justify-center gap-2.5 rounded-full px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] transition ${styles} ${className}`}
    >
      <CalendarIcon className="h-4 w-4" />
      {children}
    </button>
  );
}

function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function FloatingWhatsapp() {
  return (
    <a
      href={whatsappLink(site.whatsapp, buildMsg())}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com Letícia Cunha pelo WhatsApp"
      className="whatsapp-fab group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-50 flex items-center gap-3 sm:right-8"
    >
      <span className="pointer-events-none hidden translate-x-2 rounded-full bg-graphite px-4 py-2 text-xs font-semibold text-porcelain opacity-0 shadow-card transition duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        Fale pelo WhatsApp
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_30px_rgba(37,211,102,0.45)] transition duration-300 group-hover:scale-105">
        <span aria-hidden className="whatsapp-pulse absolute inset-0 rounded-full bg-[#25D366]" />
        <WhatsappIcon className="relative h-7 w-7" />
      </span>
    </a>
  );
}

function buildMsg() {
  return `Olá, ${site.name}! Encontrei seu site e gostaria de conversar sobre acompanhamento nutricional.`;
}

function PreFooterCta() {
  const pathname = usePathname();
  if (pathname === "/contato") return null;

  return (
    <section className="relative overflow-hidden bg-sand">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url(/gold-gradient.jpg)" }}
      />
      <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-14 sm:px-8 lg:flex-row lg:items-center lg:py-16">
        <div className="max-w-2xl">
          <SectionEyebrow>Próximo passo</SectionEyebrow>
          <h2 className="mt-4 font-display text-3xl leading-[1.1] text-graphite sm:text-4xl lg:text-5xl">
            Pronta para cuidar da sua nutrição com ciência e escuta?
          </h2>
          <p className="mt-4 text-base leading-8 text-graphite/65">
            Converse com a Letícia pelo WhatsApp e descubra a melhor forma de começar.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <BookingButton />
          <Link
            href="/fila-de-espera"
            className="interactive-lift inline-flex items-center justify-center rounded-full border border-graphite/20 bg-white/60 px-7 py-4 text-xs font-bold uppercase tracking-[0.16em] text-graphite transition hover:border-graphite"
          >
            Lista de espera
          </Link>
        </div>
      </div>
    </section>
  );
}

function NavLink({ href, label, onClick }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`link-underline pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${
        active ? "text-graphite" : "text-graphite/50 hover:text-graphite"
      }`}
    >
      {label}
    </Link>
  );
}

function AuthActions({ session, onNavigate, compact = false }) {
  if (session === undefined) {
    return <div className={compact ? "h-10" : "h-9 w-36"} aria-hidden />;
  }

  if (session?.authenticated) {
    return (
      <Link
        href={session.homePath || "/app"}
        onClick={onNavigate}
        className={
          compact
            ? "rounded-full bg-graphite px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-porcelain"
            : "btn-shine rounded-full bg-graphite px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-porcelain transition hover:bg-olive-800"
        }
      >
        {session.label || "Minha área"}
      </Link>
    );
  }

  if (compact) {
    return (
      <>
        <Link
          href="/entrar"
          onClick={onNavigate}
          className="rounded-xl px-3 py-3 text-sm font-semibold text-graphite/60 transition hover:bg-linen"
        >
          Entrar
        </Link>
        <Link
          href="/criar-conta"
          onClick={onNavigate}
          className="mt-1 rounded-full bg-graphite px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-porcelain"
        >
          Criar conta
        </Link>
      </>
    );
  }

  return (
    <>
      <Link
        href="/entrar"
        className="link-underline pb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-graphite/55 transition-colors hover:text-graphite"
      >
        Entrar
      </Link>
      <Link
        href="/criar-conta"
        className="btn-shine rounded-full bg-graphite px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-porcelain transition hover:bg-olive-800"
      >
        Criar conta
      </Link>
    </>
  );
}

export default function MarketingShell({ children }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setSession(data || { authenticated: false });
      })
      .catch(() => {
        if (!cancelled) setSession({ authenticated: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <BookingProvider>
    <div className="min-h-screen overflow-x-clip">
      <header
        className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
          scrolled || open
            ? "bg-ivory/85 shadow-[0_1px_0_rgba(47,42,39,0.06),0_12px_40px_rgba(47,42,39,0.06)] backdrop-blur-xl"
            : "bg-ivory"
        }`}
      >
        <div
          className={`mx-auto grid max-w-[90rem] grid-cols-[1fr_auto] items-center px-5 transition-[padding] duration-500 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:px-12 xl:px-20 ${
            scrolled ? "py-3" : "py-4 sm:py-5"
          }`}
        >
          <Link href="/" className="group flex min-w-0 items-center gap-3 justify-self-start" aria-label={site.name}>
            <BrandWordmark name={site.name} subtitle={site.domain} />
          </Link>

          <nav className="hidden items-center justify-center gap-10 lg:flex xl:gap-12" aria-label="Principal">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-6 justify-self-end lg:flex">
            <AuthActions session={session} />
          </div>

          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center justify-self-end rounded-full border border-graphite/15 lg:hidden"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <span
              className={`absolute h-px w-4 bg-graphite transition-transform duration-300 ${
                open ? "rotate-45" : "-translate-y-[3px]"
              }`}
            />
            <span
              className={`absolute h-px w-4 bg-graphite transition-transform duration-300 ${
                open ? "-rotate-45" : "translate-y-[3px]"
              }`}
            />
          </button>
        </div>

        <div
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-out lg:hidden ${
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0">
            <nav className="flex flex-col gap-1 border-t border-graphite/8 px-4 py-4 sm:px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 font-display text-xl text-graphite/80 transition hover:bg-linen/60 hover:text-graphite"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-graphite/8" />
              <AuthActions session={session} compact onNavigate={() => setOpen(false)} />
            </nav>
          </div>
        </div>
      </header>

      {children}

      <PreFooterCta />

      <footer className="relative overflow-hidden bg-graphite text-porcelain">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr] lg:py-20">
          <div>
            <LcMonogram tone="gold" className="h-16 w-auto" alt="" />
            <p className="mt-6 font-display text-3xl">{site.name}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-gold-300">{site.role}</p>
            <p className="mt-5 max-w-sm text-sm leading-7 text-porcelain/60">
              {site.tagline} Enfermagem, nutrição e pesquisa clínica a serviço de estratégias alimentares
              individualizadas.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-porcelain/40">Navegação</p>
            <ul className="mt-5 space-y-3 text-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="link-underline text-porcelain/75 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/fila-de-espera" className="link-underline text-porcelain/75 transition hover:text-white">
                  Lista de espera
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-porcelain/40">Legal</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link href="/privacidade" className="link-underline text-porcelain/75 transition hover:text-white">
                  Privacidade
                </Link>
              </li>
              <li>
                <Link href="/termos" className="link-underline text-porcelain/75 transition hover:text-white">
                  Termos
                </Link>
              </li>
              <li>
                <Link href="/contato" className="link-underline text-porcelain/75 transition hover:text-white">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-porcelain/40">Canais</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={instagramLink(site.instagram)}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline text-porcelain/75 transition hover:text-white"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(site.whatsapp)}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline text-porcelain/75 transition hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${site.email}`} className="link-underline text-porcelain/75 transition hover:text-white">
                  E-mail
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-porcelain/40 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>
              © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
            </p>
            <p>{site.city}</p>
          </div>
        </div>
      </footer>

      <FloatingWhatsapp />
    </div>
    </BookingProvider>
  );
}

export function SectionEyebrow({ children, className = "", tone = "default" }) {
  const toneClass = tone === "inverse" ? "text-gold-200" : "text-gold-600";
  const lineClass = tone === "inverse" ? "bg-gold-200/60" : "bg-gold-500/60";

  return (
    <p
      className={`inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] ${toneClass} ${className}`}
    >
      <span aria-hidden className={`h-px w-8 ${lineClass}`} />
      {children}
    </p>
  );
}

export function PageHero({ eyebrow, title, description, children, showBooking = true }) {
  return (
    <section className="relative overflow-hidden border-b border-olive-900/8 bg-sand">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url(/gold-gradient.jpg)" }}
      />
      <div aria-hidden className="window-light pointer-events-none absolute -inset-x-1/4 inset-y-0" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="intro" style={{ animationDelay: "80ms" }}>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
        </div>
        <h1
          className="intro mt-5 max-w-4xl font-display text-4xl leading-[1.05] text-graphite sm:text-5xl lg:text-6xl"
          style={{ animationDelay: "200ms" }}
        >
          {title}
        </h1>
        {description ? (
          <p
            className="intro mt-6 max-w-2xl text-lg leading-8 text-graphite/70"
            style={{ animationDelay: "340ms" }}
          >
            {description}
          </p>
        ) : null}
        <div className="intro mt-8 flex flex-wrap items-center gap-4" style={{ animationDelay: "460ms" }}>
          {showBooking ? <BookingButton /> : null}
          {children}
        </div>
      </div>
    </section>
  );
}
