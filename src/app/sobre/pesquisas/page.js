import Link from "next/link";
import Reveal from "@/components/Reveal";
import MarketingShell, { PageHero, SectionEyebrow } from "@/components/marketing/MarketingShell";
import {
  lattes,
  researchAreas,
  researchArticles,
  researchFocus,
  researchPrinciples,
  researchProfile,
  site
} from "@/lib/marketing/content";

export const metadata = {
  title: "Pesquisas | Letícia Cunha",
  description:
    "Artigos publicados e linhas de pesquisa em nutrição clínica — Letícia Vitória Ramos da Cunha, mestranda UFMG."
};

export default function PesquisasPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Pesquisa em nutrição"
        title="Ciência aplicada à nutrição clínica e ao cuidado individualizado."
        description={`${researchProfile.fullName} é mestranda no Programa de Pós-Graduação em Nutrição e Saúde da UFMG. Suas publicações e projetos concentram-se em nutrição clínica, terapia nutricional, cuidado materno-infantil e decisões em contextos complexos.`}
      >
        <a
          href={lattes.url}
          target="_blank"
          rel="noopener noreferrer"
          className="interactive-lift mt-8 inline-flex rounded-full border border-olive-900/12 bg-white/60 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-graphite transition hover:border-olive-700"
        >
          Ver Currículo Lattes completo
        </a>
      </PageHero>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <Reveal variant="left">
          <SectionEyebrow>Artigos publicados</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl leading-[1.12] text-graphite">Produção científica em nutrição</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-graphite/65">
            Artigos revisados por pares com coautoria de {site.name}, publicados na Revista ARACÊ.
          </p>
        </Reveal>

        <div className="mt-10 space-y-5">
          {researchArticles.map((article, index) => (
            <Reveal
              key={article.doi}
              variant="up"
              delay={index * 70}
              className="interactive-lift rounded-[1.75rem] border border-olive-900/10 bg-white/45 p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-graphite px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-porcelain">
                  {article.type}
                </span>
                <span className="text-xs uppercase tracking-[0.16em] text-graphite/45">
                  {article.journal} · {article.year}
                </span>
                {article.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-olive-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-olive-800"
                  >
                    {topic}
                  </span>
                ))}
              </div>

              <h3 className="mt-5 font-display text-2xl leading-snug text-graphite">{article.title}</h3>
              <p className="mt-2 text-xs text-graphite/50">{article.issue}</p>
              <p className="mt-4 text-sm leading-7 text-graphite/68">{article.description}</p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-olive-800 underline decoration-olive-900/20 underline-offset-4 hover:text-olive-900"
                >
                  Ler artigo
                </a>
                <span className="font-mono text-xs text-graphite/55">DOI: {article.doi}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-olive-900/8 bg-white/35 px-5 py-16 sm:px-8 lg:py-20">
        <Reveal variant="up">
          <div className="mx-auto max-w-7xl grid gap-8 rounded-[2rem] border border-olive-900/10 bg-porcelain p-8 lg:grid-cols-[1fr_1fr] lg:p-10">
            <div>
              <SectionEyebrow>Vínculo acadêmico</SectionEyebrow>
              <h2 className="mt-4 font-display text-3xl leading-snug text-graphite">{researchProfile.program}</h2>
              <p className="mt-3 text-sm font-semibold text-graphite/55">{researchProfile.institution}</p>
              <dl className="mt-8 space-y-4 text-sm">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">Linha</dt>
                  <dd className="mt-1 text-graphite/75">{researchProfile.researchLine}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">Orientadora</dt>
                  <dd className="mt-1 text-graphite/75">{researchProfile.advisor}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">Admissão</dt>
                  <dd className="mt-1 text-graphite/75">{researchProfile.admission}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">Previsão de conclusão</dt>
                  <dd className="mt-1 text-graphite/75">{researchProfile.expectedCompletion}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-[1.5rem] bg-linen/80 p-6">
              <SectionEyebrow>Linha da orientadora</SectionEyebrow>
              <p className="mt-4 text-sm leading-7 text-graphite/70">{researchProfile.advisorLine}</p>
              <p className="mt-6 text-sm leading-7 text-graphite/70">
                A pesquisa de {site.name} dialoga com esse eixo de nutrição clínica e experimental, conectando
                evidências científicas à prática no acompanhamento de pacientes.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <Reveal variant="up">
          <SectionEyebrow>Temas de investigação</SectionEyebrow>
          <h2 className="mt-4 font-display text-4xl leading-[1.12] text-graphite">Linhas de interesse em nutrição</h2>
        </Reveal>
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {researchAreas.map((area, index) => (
            <Reveal
              key={area.title}
              variant="up"
              delay={index * 70}
              className="interactive-lift flex h-full flex-col rounded-[1.75rem] border border-olive-900/10 bg-white/45 p-7"
            >
              <span className="inline-flex w-fit rounded-full bg-olive-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-olive-800">
                {area.tag}
              </span>
              <h2 className="mt-5 font-display text-3xl leading-snug tracking-normal text-graphite">{area.title}</h2>
              <p className="mt-4 flex-1 text-sm leading-7 text-graphite/68">{area.description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-olive-900/8 bg-linen/50 px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <Reveal variant="up">
            <SectionEyebrow>Em desenvolvimento</SectionEyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.12] text-graphite">Mestrado e próximos passos</h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {researchFocus.map((item, index) => (
              <Reveal
                key={item.title}
                variant="up"
                delay={index * 70}
                className="rounded-[1.5rem] border border-olive-900/10 bg-white/60 p-6"
              >
                {item.period ? (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-olive-700">{item.period}</p>
                ) : null}
                <h3 className="mt-3 font-semibold leading-snug text-graphite">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-graphite/65">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-olive-900/8 bg-graphite px-5 py-16 text-porcelain sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal variant="left">
            <SectionEyebrow tone="inverse">Como a pesquisa entra na consulta</SectionEyebrow>
            <h2 className="mt-4 font-display text-4xl leading-[1.12] sm:text-5xl">
              Evidência científica traduzida em condutas possíveis.
            </h2>
          </Reveal>
          <Reveal variant="right">
            <ul className="space-y-4">
              {researchPrinciples.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-porcelain/75">
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="interactive-lift rounded-[2rem] border border-olive-900/10 bg-linen/70 p-8 sm:p-10">
          <SectionEyebrow>Acadêmico & imprensa</SectionEyebrow>
          <p className="mt-4 max-w-3xl font-display text-3xl leading-snug text-graphite">
            Convites para palestras, mesas redondas e parcerias acadêmicas em nutrição podem ser enviados pelo
            formulário de contato.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contato"
              className="interactive-lift inline-flex rounded-full bg-graphite px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-porcelain"
            >
              Entrar em contato
            </Link>
            <a
              href={lattes.url}
              target="_blank"
              rel="noopener noreferrer"
              className="interactive-lift inline-flex rounded-full border border-olive-900/12 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-graphite"
            >
              Currículo Lattes
            </a>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
