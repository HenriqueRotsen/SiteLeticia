import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import MarketingShell, { SectionEyebrow } from "@/components/marketing/MarketingShell";
import { formationHighlights, formationTimeline, site } from "@/lib/marketing/content";

export const metadata = {
  title: "Formação | Letícia Cunha",
  description: "Trajetória acadêmica e formação profissional de Letícia Cunha em Enfermagem, Nutrição e mestrado UFMG."
};

const periodStyles = {
  Concluído: "bg-olive-100 text-olive-800 ring-olive-200/60",
  "Em curso": "bg-amber-50 text-amber-900 ring-amber-200/70"
};

const FORMATION_CONTENT_FADE =
  "linear-gradient(90deg, #f2eee4 0%, #f2eee4 22%, rgba(242, 238, 228, 0.98) 30%, rgba(242, 238, 228, 0.9) 38%, rgba(242, 238, 228, 0.72) 46%, rgba(242, 238, 228, 0.42) 52%, rgba(242, 238, 228, 0.12) 58%, transparent 64%)";

const FORMATION_PILLARS = ["Enfermagem", "Nutrição", "Mestrado UFMG"];

function IntroPanel({ children, className = "" }) {
  return (
    <div
      className={`rounded-[1.75rem] border border-olive-900/10 bg-white/72 p-7 shadow-card backdrop-blur-sm sm:rounded-[2rem] sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}

function SectionIntro({ eyebrow, title, description }) {
  return (
    <>
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h2 className="mt-3 font-display text-3xl leading-[1.08] text-graphite sm:text-4xl">{title}</h2>
      {description ? <p className="mt-3 max-w-xl text-base leading-8 text-graphite/65">{description}</p> : null}
    </>
  );
}

function TimelineStep({ item, index, total }) {
  const periodClass = periodStyles[item.period] || "bg-white text-graphite ring-olive-900/10";

  return (
    <article className="relative">
      <div className="rounded-[1.75rem] border border-olive-900/10 bg-white/75 shadow-card backdrop-blur-sm sm:rounded-[2rem]">
        <div className="grid gap-0 lg:grid-cols-[10rem_1fr]">
          <div className="flex flex-col items-start gap-3 border-b border-olive-900/8 bg-linen/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-start lg:justify-center lg:border-b-0 lg:border-r lg:px-5 lg:py-8">
            <span className="font-display text-5xl leading-none text-olive-200 sm:text-6xl">
              0{index + 1}
            </span>
            <span
              className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ring-inset ${periodClass}`}
            >
              {item.period}
            </span>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-graphite/45">
              {item.institution}
            </p>
            <h2 className="mt-2 font-display text-3xl leading-snug text-graphite sm:text-4xl">{item.title}</h2>
            <p className="mt-4 text-base leading-8 text-graphite/68">{item.description}</p>
          </div>
        </div>
      </div>

      {index < total - 1 ? (
        <div className="flex justify-center py-4 lg:justify-start lg:pl-[3.65rem]">
          <span className="h-10 w-px bg-gradient-to-b from-olive-400/50 to-olive-900/10" aria-hidden />
        </div>
      ) : null}
    </article>
  );
}

export default function FormacaoPage() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden bg-linen">
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
          <Image
            src="/leticia2.jpeg"
            alt=""
            fill
            priority
            className="object-cover object-[62%_22%] sm:object-[68%_22%] lg:object-[78%_20%]"
            sizes="100vw"
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{ background: FORMATION_CONTENT_FADE }}
        />

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-12 lg:pb-24 lg:pt-16">
          <div className="max-w-3xl lg:max-w-[min(100%,44rem)]">
            <Reveal variant="up">
              <IntroPanel>
                <SectionEyebrow>Formação profissional</SectionEyebrow>
                <h1 className="mt-3 max-w-2xl font-display text-[2rem] leading-[1.08] text-graphite sm:text-4xl lg:text-[2.75rem]">
                  Trajetória acadêmica em nutrição clínica
                </h1>
                <p className="mt-4 max-w-xl text-base leading-8 text-graphite/65">
                  Enfermagem, Nutrição e mestrado na UFMG. Ciência, escuta e conduta responsável em cada
                  etapa.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {FORMATION_PILLARS.map((label) => (
                    <li
                      key={label}
                      className="rounded-full border border-olive-900/10 bg-linen/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-graphite/70"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </IntroPanel>
            </Reveal>

            <div className="mt-10 lg:mt-12">
              <Reveal variant="up" delay={100}>
                <IntroPanel className="relative overflow-hidden pl-7 sm:pl-8">
                  <span
                    aria-hidden
                    className="absolute inset-y-4 left-0 w-1 rounded-full bg-olive-600/80"
                  />
                  <SectionIntro
                    eyebrow="Linha do tempo"
                    title="Do cuidado clínico à pesquisa aplicada"
                    description="Cada formação acrescenta uma camada de leitura clínica, evidência científica e escuta do paciente."
                  />
                </IntroPanel>
              </Reveal>

              <div className="relative mt-8 border-l border-olive-900/12 pl-5 sm:pl-7 lg:pl-8">
                {formationTimeline.map((item, index) => (
                  <Reveal key={item.title} variant="up" delay={index * 100}>
                    <TimelineStep item={item} index={index} total={formationTimeline.length} />
                  </Reveal>
                ))}
              </div>
            </div>

            <div className="mt-14 grid gap-8 lg:mt-20">
              <Reveal variant="up" className="rounded-[1.75rem] border border-olive-900/10 bg-white/75 p-7 shadow-card backdrop-blur-sm sm:p-8">
                <SectionEyebrow>Competências</SectionEyebrow>
                <h3 className="mt-4 font-display text-3xl text-graphite">
                  O que essa formação sustenta na consulta
                </h3>
                <ul className="mt-6 space-y-4">
                  {formationHighlights.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-7 text-graphite/70">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-olive-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal variant="up" delay={80} className="rounded-[1.75rem] bg-graphite p-7 text-porcelain sm:p-8">
                <p className="font-display text-2xl leading-snug sm:text-3xl">
                  “A formação clínica me ensinou a olhar o paciente inteiro, não apenas o prato.”
                </p>
                <p className="mt-4 text-sm text-porcelain/65">{site.name}</p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-olive-900/8 bg-white/35 px-5 py-14 sm:px-8">
        <Reveal variant="up" className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <SectionEyebrow>Próximo passo</SectionEyebrow>
            <p className="mt-3 font-display text-3xl text-graphite">Conheça também as linhas de pesquisa.</p>
          </div>
          <Link
            href="/sobre/pesquisas"
            className="interactive-lift rounded-full bg-graphite px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-porcelain"
          >
            Ver pesquisas
          </Link>
        </Reveal>
      </section>
    </MarketingShell>
  );
}
