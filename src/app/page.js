import Image from "next/image";
import Link from "next/link";

const credentials = [
  "Formada em Enfermagem",
  "Graduanda em Nutrição",
  "Mestranda em Nutrição Clínica pela UFMG"
];

const specialties = [
  "Bariátrica",
  "Nutrição clínica",
  "Nutrição de precisão",
  "Nutrição gastrointestinal"
];

const pillars = [
  {
    title: "Ciência aplicada à rotina",
    text: "Condutas baseadas em evidências, traduzidas para escolhas possíveis no dia a dia."
  },
  {
    title: "Olhar individual",
    text: "Estratégias pensadas para a história, os sintomas, os objetivos e o contexto de cada paciente."
  },
  {
    title: "Experiência real de transformação",
    text: "Após perder 50 kg depois da cirurgia bariátrica em 2022, Leticia une vivência e formação para acolher com responsabilidade."
  }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-olive-900/10 bg-porcelain/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="#" className="text-sm font-semibold uppercase tracking-[0.2em] text-olive-800">
            Leticia Cunha | Nutrição
          </a>
          <nav className="flex items-center gap-3">
            <a
              href="#sobre"
              className="hidden text-sm font-medium text-graphite/70 transition hover:text-olive-800 sm:inline"
            >
              Sobre
            </a>
            <Link
              href="/fila-de-espera"
              className="rounded-full bg-olive-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-olive-800"
            >
              Lista de espera
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_0.92fr] lg:gap-16">
        <div>
          <p className="mb-5 inline-flex rounded-full bg-olive-100 px-4 py-2 text-sm font-semibold text-olive-800">
            Nutrição clínica, bariátrica e de precisão
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-graphite sm:text-5xl lg:text-6xl">
            Nutrição baseada em ciência, história clínica e cuidado individual.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-graphite/72">
            Leticia Cunha é formada em Enfermagem, cursa Nutrição e faz
            mestrado em Nutrição Clínica pela UFMG. Sua atuação nasce da
            união entre formação técnica, vivência pessoal e um compromisso:
            atender cada paciente da melhor forma para aquele indivíduo.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/fila-de-espera"
              className="inline-flex items-center justify-center rounded-2xl bg-olive-700 px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-olive-800"
            >
              Entrar na lista
            </Link>
            <a
              href="#sobre"
              className="inline-flex items-center justify-center rounded-2xl border border-olive-700/25 px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-graphite transition hover:border-olive-700 hover:bg-white/60"
            >
              Conhecer a Leticia
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {credentials.map((item) => (
              <div
                key={item}
                className="border-l-2 border-olive-500 bg-white/40 px-4 py-3 text-sm font-medium leading-6 text-graphite/78"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 shadow-soft">
          <Image
            src="/leticia1.jpeg"
            alt="Leticia Cunha"
            width={2021}
            height={2374}
            priority
            className="h-[520px] w-full object-cover object-[center_15%] sm:h-[650px] lg:h-[760px]"
            sizes="(min-width: 1024px) 44vw, 100vw"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/80 via-graphite/20 to-transparent p-6 text-white sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-olive-100">
              Leticia Cunha
            </p>
            <p className="mt-2 max-w-sm text-xl font-semibold">
              Cuidado nutricional para uma vida mais saudável, possível e sustentável.
            </p>
          </div>
        </div>
      </section>

      <section id="sobre" className="bg-white/45 px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive-700">
              Sobre a Leticia
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight text-graphite sm:text-4xl">
              Uma trajetória que conecta saúde, ciência e experiência de vida.
            </h2>
          </div>

          <div className="space-y-8">
            <p className="text-lg leading-8 text-graphite/72">
              Após perder 50 kg depois da cirurgia bariátrica em 2022, Leticia
              passou a fomentar um estilo de vida saudável com responsabilidade,
              acolhimento e base científica. Sua proposta não é entregar um plano
              genérico, mas construir estratégias alimentares coerentes com o
              organismo, a rotina e os objetivos de cada paciente.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              {pillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="rounded-2xl border border-olive-900/10 bg-porcelain p-5"
                >
                  <h3 className="text-base font-semibold text-graphite">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-graphite/68">{pillar.text}</p>
                </article>
              ))}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-graphite">Especializações</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full border border-olive-700/20 bg-olive-50 px-4 py-2 text-sm font-semibold text-olive-900"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-graphite p-6 text-white">
              <p className="text-xl font-semibold leading-8">
                A agenda de atendimentos está em preparação. Interessados podem
                entrar na lista de prioridade para acompanhar sua posição.
              </p>
              <Link
                href="/fila-de-espera"
                className="mt-5 inline-flex rounded-2xl bg-olive-500 px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white transition hover:bg-olive-400"
              >
                Acessar lista de espera
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
