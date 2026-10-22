import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import MarketingShell, { BookingButton, SectionEyebrow } from "@/components/marketing/MarketingShell";
import { portraitBlur, portraitBwBlur } from "@/lib/branding/placeholders";
import { credentials, heroHighlights, pillars, site, specialties } from "@/lib/marketing/content";

const steps = [
  {
    title: "Lista de espera",
    text: "Você garante seu lugar e é avisada assim que novas vagas de atendimento forem abertas."
  },
  {
    title: "Pré-consulta",
    text: "Um questionário completo sobre história, rotina, sintomas e objetivos prepara o primeiro encontro."
  },
  {
    title: "Consulta",
    text: "Escuta atenta, leitura de exames e construção conjunta de um plano possível para a sua vida."
  },
  {
    title: "Acompanhamento",
    text: "Plano alimentar, exames, fotos e evolução reunidos na plataforma, com ajustes ao longo do caminho."
  }
];

function ArrowRight({ className = "" }) {
  return (
    <svg viewBox="0 0 28 10" fill="none" aria-hidden className={className}>
      <path d="M0 5h26M22 1l4 4-4 4" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
}

function SealRing({ className = "", mark = "/brand-mark.png", id = "seal-ring" }) {
  return (
    <div className={`relative aspect-square ${className}`}>
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path id={id} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
        </defs>
        <text fill="currentColor" fontSize="13" fontWeight="600">
          <textPath href={`#${id}`} textLength="486" lengthAdjust="spacing">
            {"NUTRICIONISTA • SAÚDE & NUTRIÇÃO • "}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-[30%] flex items-center justify-center rounded-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mark} alt="" className="h-full w-auto object-contain" />
      </div>
    </div>
  );
}

export default function Home() {

  return (
    <MarketingShell>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-[#DDD2C3]">
        {/* Fundo do hero: parede marrom à esquerda e luz de janela bege à direita */}
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          priority
          quality={85}
          className="pointer-events-none select-none object-cover object-[78%_50%] lg:object-center"
          sizes="100vw"
        />
        <div className="relative grid lg:min-h-[calc(100svh-5.25rem)] lg:grid-cols-[48%_1fr]">
          {/* Foto recortada por cima do fundo + monograma */}
          <div className="relative h-[66svh] min-h-[26rem] lg:h-auto">
            <div className="hero-cutout">
              <Image
                src="/hero-cutout-v3.webp"
                alt={`${site.name}, ${site.role.toLowerCase()}`}
                fill
                priority
                quality={90}
                className="hero-photo select-none object-contain"
                sizes="(min-width: 1024px) 52vw, 100vw"
              />
            </div>
            <div className="hero-mark hero-logo pointer-events-none">
              <Image
                src="/brand-mark-cream.png"
                alt=""
                fill
                priority
                className="select-none object-contain object-left-bottom drop-shadow-[0_8px_24px_rgba(47,42,39,0.18)]"
                sizes="(min-width: 1024px) 25rem, 40vw"
              />
            </div>
          </div>

          {/* Texto */}
          <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-16 text-center sm:px-12 lg:px-10 lg:py-20 xl:px-14">

            <div className="relative z-[1] flex w-full max-w-[36rem] flex-col items-center">
              <p
                className="intro text-[11px] font-medium uppercase tracking-[0.42em] text-graphite/75"
                style={{ animationDelay: "250ms" }}
              >
                {site.role}
              </p>
              <h1
                className="intro mt-8 font-display text-[2.1rem] leading-[1.12] tracking-[-0.01em] text-graphite min-[400px]:text-[2.35rem] sm:text-[3.2rem] lg:text-[2.9rem] xl:text-[3.5rem] 2xl:text-[3.9rem]"
                style={{ animationDelay: "380ms" }}
              >
                <span className="whitespace-nowrap">Nutrição com método,</span>
                <br />
                <span className="sm:whitespace-nowrap">
                  história e <em className="font-display italic">cuidado</em>.
                </span>
              </h1>
              <p
                className="intro mt-8 max-w-[24rem] text-[11px] uppercase leading-[1.9] tracking-[0.22em] text-graphite/75 sm:text-[13px] sm:leading-[1.75]"
                style={{ animationDelay: "520ms" }}
              >
                {site.valueProposition}
              </p>

              <div
                className="intro mt-10 flex w-full flex-col items-center justify-center gap-3 sm:flex-row"
                style={{ animationDelay: "660ms" }}
              >
                <BookingButton className="w-full sm:w-auto" />
                <Link
                  href="/fila-de-espera"
                  className="inline-flex w-full items-center justify-center rounded-full border border-graphite/25 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-graphite transition duration-300 hover:-translate-y-0.5 hover:border-graphite hover:bg-white/50 sm:w-auto"
                >
                  Entrar na lista de espera
                </Link>

              </div>
              <Link
                href="/sobre/formacao"
                className="intro group mt-7 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-graphite/60 transition hover:text-graphite"
                style={{ animationDelay: "780ms" }}
              >
                Ver formação
                <ArrowRight className="w-7 transition-transform duration-500 group-hover:translate-x-1.5" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ================= DESTAQUES ================= */}
      <section className="relative border-y border-graphite/[0.07] bg-ivory">
        <div className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
          {heroHighlights.map((item, index) => (
            <Reveal
              key={item.label}
              variant="up"
              delay={index * 110}
              className={`px-5 py-9 text-center sm:px-8 lg:py-12 ${index % 2 === 1 ? "border-l" : ""} ${
                index > 1 ? "border-t lg:border-t-0" : ""
              } ${index === 2 ? "lg:border-l" : ""} border-graphite/[0.07]`}
            >
              <p className="font-display text-2xl leading-tight text-gold-600 sm:text-[1.85rem]">{item.value}</p>
              <p className="mx-auto mt-2 max-w-[14rem] text-[10px] uppercase leading-5 tracking-[0.2em] text-graphite/55">
                {item.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= ABORDAGEM ================= */}
      <section className="relative bg-cream">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-32">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-20">
            <Reveal variant="up">
              <SectionEyebrow>01 · Abordagem</SectionEyebrow>
              <h2 className="mt-6 font-display text-[2.4rem] leading-[1.1] text-graphite sm:text-5xl lg:text-[3.4rem]">
                Menos fórmula pronta. Mais <em className="italic text-gold-700">escuta</em>, ciência e plano
                individualizado.
              </h2>
            </Reveal>
            <Reveal variant="up" delay={150}>
              <p className="text-lg leading-8 text-graphite/65">
                Cada paciente chega com uma história diferente. A proposta é traduzir evidências em condutas
                sustentáveis, sem rigidez desnecessária e com acompanhamento próximo ao longo do processo.
              </p>
            </Reveal>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-[2rem] border border-graphite/[0.08] bg-graphite/[0.08] lg:mt-20 lg:grid-cols-3">
            {pillars.map((pillar, index) => (
              <Reveal
                key={pillar.title}
                variant="up"
                delay={index * 120}
                className="group relative bg-cream p-8 transition-colors duration-500 hover:bg-ivory sm:p-10"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-5xl italic text-gold-300 transition-colors duration-500 group-hover:text-gold-500">
                    {pillar.number}
                  </span>
                  <span className="h-px w-12 bg-gold-400/50 transition-all duration-500 group-hover:w-20" />
                </div>
                <h3 className="mt-10 font-display text-[1.7rem] leading-snug text-graphite">{pillar.title}</h3>
                <p className="mt-3 text-[15px] leading-7 text-graphite/60">{pillar.text}</p>
              </Reveal>
            ))}
          </div>
          <Reveal variant="up" className="mt-12 flex justify-center">
            <BookingButton />
          </Reveal>
        </div>
      </section>

      {/* ================= TRAJETÓRIA ================= */}
      <section className="relative overflow-hidden bg-cream">
        <div className="mx-auto grid max-w-7xl gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-24 lg:py-32">
          <Reveal variant="up" className="relative mx-auto w-full max-w-[30rem]">
            <div className="img-zoom relative aspect-[4/5] overflow-hidden rounded-t-full bg-sand shadow-soft">
              <Image
                src="/leticia-portrait-bw.jpg"
                alt={`Retrato de ${site.name}`}
                fill
                placeholder="blur"
                blurDataURL={portraitBwBlur}
                quality={85}
                className="object-cover object-[center_25%]"
                sizes="(min-width: 1024px) 30rem, 90vw"
              />
            </div>
            <SealRing className="absolute -bottom-8 -left-4 z-10 w-32 rounded-full bg-ivory p-2 text-graphite shadow-card ring-1 ring-gold-300/40 sm:-left-10 sm:w-40" id="seal-ring-story" />
          </Reveal>

          <div>
            <Reveal variant="up">
              <SectionEyebrow>02 · Trajetória</SectionEyebrow>
              <h2 className="mt-6 font-display text-[2.4rem] leading-[1.1] text-graphite sm:text-5xl">
                Formação clínica, pesquisa e <em className="italic text-gold-700">experiência pessoal</em> no mesmo
                lugar.
              </h2>
              <p className="mt-6 text-lg leading-8 text-graphite/65">
                Enfermagem, graduação em Nutrição e mestrado em Nutrição Clínica pela UFMG compõem uma base sólida
                para atender com responsabilidade, inclusive pacientes pós-bariátricos e casos clínicos complexos.
              </p>
            </Reveal>

            <ol className="mt-10">
              {credentials.map((item, index) => (
                <Reveal
                  as="li"
                  key={item.label}
                  variant="up"
                  delay={index * 120}
                  className="group relative flex gap-6 border-t border-graphite/10 py-6 last:border-b"
                >
                  <span className="pt-1 font-display text-lg italic text-gold-500">0{index + 1}</span>
                  <div>
                    <p className="font-display text-xl text-graphite transition-colors group-hover:text-gold-700">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-graphite/55">{item.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>

            <Reveal variant="up" delay={200} className="mt-10 flex flex-wrap gap-3">
              <BookingButton className="w-full sm:w-auto" />
              <Link
                href="/sobre/formacao"
                className="group inline-flex items-center gap-3 rounded-full border border-graphite/20 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-graphite transition duration-300 hover:border-graphite hover:bg-graphite hover:text-porcelain"
              >
                Formação profissional
                <ArrowRight className="w-6 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/sobre/pesquisas"
                className="group inline-flex items-center gap-3 rounded-full border border-graphite/20 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-graphite transition duration-300 hover:border-graphite hover:bg-graphite hover:text-porcelain"
              >
                Linhas de pesquisa
                <ArrowRight className="w-6 transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= ESPECIALIDADES ================= */}
      <section className="relative bg-ivory">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-32">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <Reveal variant="up">
              <SectionEyebrow>03 · Especialidades</SectionEyebrow>
              <h2 className="mt-6 max-w-2xl font-display text-[2.4rem] leading-[1.1] text-graphite sm:text-5xl">
                Áreas de atuação <em className="italic text-gold-700">clínica</em>
              </h2>
            </Reveal>
            <Reveal variant="up" delay={120}>
              <p className="max-w-sm text-base leading-7 text-graphite/60">
                Condutas construídas a partir da sua história, dos seus exames e do que é possível na sua rotina.
              </p>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <Reveal variant="up" className="relative hidden lg:block">
              <div className="img-zoom sticky top-28 aspect-[3/4] overflow-hidden rounded-[2rem] bg-sand shadow-soft">
                <Image
                  src="/leticia-portrait.jpg"
                  alt={`Retrato de ${site.name}`}
                  fill
                  placeholder="blur"
                  blurDataURL={portraitBlur}
                  quality={85}
                  className="object-cover object-[center_20%]"
                  sizes="(min-width: 1024px) 32vw, 1px"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/50 to-transparent p-7">
                  <p className="font-display text-2xl text-white">{site.name}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-white/75">{site.role}</p>
                </div>
              </div>
            </Reveal>

            <ul>
              {specialties.map((item, index) => (
                <Reveal
                  as="li"
                  key={item.title}
                  variant="up"
                  delay={index * 100}
                  className="group relative border-t border-graphite/10 last:border-b"
                >
                  <div className="relative flex items-start gap-6 py-8 transition-[padding] duration-500 group-hover:pl-4 sm:gap-10 sm:py-10">
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-0 origin-left scale-x-0 bg-cream transition-transform duration-700 ease-out group-hover:scale-x-100"
                    />
                    <span className="relative pt-2 font-display text-base italic text-gold-500">0{index + 1}</span>
                    <div className="relative flex-1">
                      <h3 className="font-display text-3xl leading-tight text-graphite sm:text-[2.4rem]">
                        {item.title}
                      </h3>
                      <p className="mt-3 max-w-lg text-[15px] leading-7 text-graphite/60">{item.text}</p>
                    </div>
                    <ArrowRight className="relative mt-4 hidden w-8 shrink-0 text-gold-500 opacity-0 transition-all duration-500 group-hover:translate-x-1 group-hover:opacity-100 sm:block" />
                  </div>
                </Reveal>
              ))}
            </ul>
          </div>
          <Reveal variant="up" className="mt-12 flex justify-center">
            <BookingButton />
          </Reveal>
        </div>
      </section>

      {/* ================= COMO FUNCIONA ================= */}
      <section className="relative overflow-hidden bg-sand">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url(/gold-gradient.jpg)" }}
        />
        <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
          <Reveal variant="up" className="mx-auto max-w-2xl text-center">
            <SectionEyebrow>04 · Como funciona</SectionEyebrow>
            <h2 className="mt-6 font-display text-[2.4rem] leading-[1.1] text-graphite sm:text-5xl">
              Um caminho claro, do primeiro contato ao acompanhamento.
            </h2>
          </Reveal>

          <Reveal variant="up" className="relative mt-16">
            <div aria-hidden className="line-grow absolute left-0 right-0 top-6 hidden h-px bg-gold-500/40 lg:block" />
            <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {steps.map((step, index) => (
                <li key={step.title} className="relative">
                  <span className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-full border border-gold-500/50 bg-ivory font-display text-lg italic text-gold-700 shadow-card">
                    {index + 1}
                  </span>
                  <h3 className="mt-6 font-display text-2xl text-graphite">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-graphite/60">{step.text}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal variant="up" className="mt-12 flex justify-center">
            <BookingButton />
          </Reveal>
        </div>
      </section>

      {/* ================= CTA PLATAFORMA ================= */}
      <section className="relative overflow-hidden bg-graphite text-porcelain">
        <div className="grid lg:grid-cols-2">
          <div className="relative order-2 px-5 py-20 sm:px-12 lg:order-1 lg:px-16 lg:py-28 xl:px-24">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-gold/15 blur-3xl"
            />
            <Reveal variant="up" className="relative max-w-xl">
              <SectionEyebrow tone="inverse">05 · Acompanhamento</SectionEyebrow>
              <h2 className="mt-6 font-display text-[2.4rem] leading-[1.1] sm:text-5xl">
                Consultas, dieta, exames e evolução. <em className="italic text-gold-300">Tudo em um só lugar.</em>
              </h2>
              <p className="mt-6 text-lg leading-8 text-porcelain/65">
                Pacientes acompanham o plano alimentar, enviam fotos e exames, agendam consultas e visualizam a
                própria evolução. A agenda de novos atendimentos está em preparação — entre na lista de espera e
                seja avisada primeiro.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <BookingButton />
                <Link
                  href="/fila-de-espera"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-porcelain transition duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/5"
                >
                  Entrar na lista de espera
                </Link>

                <Link
                  href="/criar-conta"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-[11px] font-bold uppercase tracking-[0.18em] text-porcelain transition duration-300 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/5"
                >
                  Criar conta
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="img-zoom relative order-1 h-[60svh] min-h-[22rem] overflow-hidden lg:order-2 lg:h-auto">
            <Image
              src="/leticia-portrait-bw.jpg"
              alt={`Retrato de ${site.name}`}
              fill
              quality={85}
              placeholder="blur"
              blurDataURL={portraitBwBlur}
              className="object-cover object-[center_22%]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/10 to-transparent lg:bg-gradient-to-r lg:from-graphite lg:via-graphite/10 lg:to-transparent"
            />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
