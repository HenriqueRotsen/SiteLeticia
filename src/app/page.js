import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import MarketingShell, { SectionEyebrow } from "@/components/marketing/MarketingShell";
import { credentials, pillars, site, specialties } from "@/lib/marketing/content";

export default function Home() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden">
        <div className="relative mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-end gap-10 px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:pb-16 lg:pt-8">
          <Reveal variant="left">
            <SectionEyebrow>Estúdio clínico de nutrição</SectionEyebrow>
            <h1 className="mt-6 max-w-3xl font-display text-[2.75rem] leading-[1.08] text-graphite sm:text-6xl lg:text-7xl">
              Nutrição com método, história e cuidado real.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-graphite/68">
              {site.name} une enfermagem, nutrição e pesquisa clínica para construir estratégias alimentares
              individualizadas, com foco em bariátrica, saúde intestinal e nutrição de precisão.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/fila-de-espera"
                className="interactive-lift inline-flex items-center justify-center rounded-full bg-graphite px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-porcelain transition hover:bg-olive-800"
              >
                Entrar na lista
              </Link>
              <Link
                href="/contato"
                className="interactive-lift inline-flex items-center justify-center rounded-full border border-graphite/15 bg-white/50 px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-graphite transition hover:border-olive-700"
              >
                Falar com a Letícia
              </Link>
              <Link
                href="/sobre/formacao"
                className="inline-flex items-center justify-center px-2 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-graphite/55 transition hover:text-olive-800"
              >
                Ver formação →
              </Link>
            </div>

            <div className="mt-10 max-w-sm rounded-2xl border border-olive-900/10 bg-white/60 px-5 py-4">
              <p className="text-3xl font-display leading-snug text-olive-800">−50 kg</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-graphite/55">
                Perdeu após bariátrica em 2022
              </p>
            </div>
          </Reveal>

          <Reveal variant="scale" delay={120} className="relative">
            <div className="interactive-lift relative overflow-hidden rounded-[2rem] border border-olive-900/10 shadow-card">
              <Image
                src="/leticia1.jpeg"
                alt={site.name}
                width={2021}
                height={2374}
                priority
                className="aspect-[4/5] w-full object-cover object-[center_15%] sm:aspect-[5/6] lg:min-h-[680px]"
                sizes="(min-width: 1024px) 42vw, 100vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/90 via-graphite/45 to-transparent p-6 sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-olive-100">
                  {site.role}
                </p>
                <p className="mt-2 max-w-sm font-display text-2xl leading-snug text-white">
                  Transformação com base científica e acolhimento.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <Reveal variant="left">
            <SectionEyebrow>01 · Abordagem</SectionEyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.12] text-graphite sm:text-5xl">
              Menos fórmula pronta. Mais escuta, ciência e plano possível.
            </h2>
          </Reveal>
          <Reveal variant="right">
            <p className="text-lg leading-8 text-graphite/68">
              Cada paciente chega com uma história diferente. A proposta é traduzir evidências em condutas
              sustentáveis, sem rigidez desnecessária e com acompanhamento próximo ao longo do processo.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {pillars.map((pillar, index) => (
            <Reveal
              key={pillar.title}
              variant="up"
              delay={index * 90}
              className="interactive-lift rounded-[1.75rem] border border-olive-900/10 bg-white/45 p-7"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-olive-700">{pillar.number}</p>
              <h3 className="mt-4 font-display text-2xl leading-snug tracking-normal text-graphite">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-7 text-graphite/65">{pillar.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-olive-900/8 bg-white/35 px-5 py-16 sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="up">
            <SectionEyebrow>02 · Especialidades</SectionEyebrow>
            <h2 className="mt-4 max-w-3xl font-display text-4xl leading-[1.12] text-graphite sm:text-5xl">
              Áreas de atuação clínica
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {specialties.map((item, index) => (
              <Reveal
                key={item.title}
                variant={index % 2 === 0 ? "left" : "right"}
                delay={index * 70}
                className="group interactive-lift overflow-hidden rounded-[1.75rem] border border-olive-900/10 bg-porcelain p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-3xl leading-snug tracking-normal text-graphite">{item.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-7 text-graphite/65">{item.text}</p>
                  </div>
                  <span className="text-4xl font-display text-olive-200 transition group-hover:text-olive-400">
                    0{index + 1}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
        <Reveal variant="left" className="order-2 lg:order-1">
          <div className="interactive-lift overflow-hidden rounded-[2rem] border border-olive-900/10 bg-white/40 shadow-soft">
            <Image
              src="/leticia2.jpeg"
              alt={`${site.name} em atendimento`}
              width={1600}
              height={1200}
              className="aspect-[4/3] w-full object-cover"
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          </div>
        </Reveal>

        <Reveal variant="right" className="order-1 lg:order-2">
          <SectionEyebrow>03 · Trajetória</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl leading-[1.12] text-graphite sm:text-5xl">
            Formação clínica, pesquisa e experiência pessoal no mesmo lugar.
          </h2>
          <p className="mt-6 text-lg leading-8 text-graphite/68">
            Enfermagem, graduação em Nutrição e mestrado em Nutrição Clínica pela UFMG compõem uma base sólida
            para atender com responsabilidade, inclusive pacientes pós-bariátricos e casos clínicos complexos.
          </p>

          <div className="mt-8 space-y-4">
            {credentials.map((item) => (
              <div key={item.label} className="rounded-2xl border border-olive-900/10 bg-white/50 px-5 py-4">
                <p className="font-semibold text-graphite">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-graphite/60">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sobre/formacao"
              className="interactive-lift rounded-full border border-olive-900/12 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-graphite transition hover:border-olive-700"
            >
              Formação profissional
            </Link>
            <Link
              href="/sobre/pesquisas"
              className="interactive-lift rounded-full border border-olive-900/12 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-graphite transition hover:border-olive-700"
            >
              Linhas de pesquisa
            </Link>
          </div>
        </Reveal>
      </section>

      <section className="bg-graphite px-5 py-16 text-porcelain sm:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="up" className="mx-auto max-w-3xl text-center">
            <SectionEyebrow tone="inverse">04 · Acompanhamento</SectionEyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.12] sm:text-5xl">
              Plataforma para consultas, dieta, exames e evolução. Tudo em um só lugar.
            </h2>
            <p className="mt-6 text-lg leading-8 text-porcelain/72">
              Pacientes acompanham plano alimentar, enviam fotos e exames, agendam consultas e visualizam a
              evolução. A agenda de novos atendimentos está em preparação. Entre na lista de prioridade.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/fila-de-espera"
                className="interactive-lift rounded-full bg-olive-500 px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-olive-400"
              >
                Criar conta / lista de espera
              </Link>
              <Link
                href="/demo"
                className="interactive-lift rounded-full border border-white/15 px-7 py-4 text-xs font-bold uppercase tracking-[0.18em] text-porcelain transition hover:bg-white/10"
              >
                Explorar demo
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
