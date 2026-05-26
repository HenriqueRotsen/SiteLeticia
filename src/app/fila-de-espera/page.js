import Image from "next/image";
import Link from "next/link";
import WaitlistBox from "@/components/WaitlistBox";

const highlights = [
  "Atendimento individualizado",
  "Plano alimentar possível na rotina",
  "Prioridade por ordem de entrada"
];

export const metadata = {
  title: "Fila de Espera | Letícia Cunha",
  description:
    "Entre na lista de prioridade e acompanhe sua posição na fila de espera da Letícia Cunha."
};

export default function WaitlistPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-30 border-b border-olive-900/10 bg-porcelain/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-olive-800"
          >
            Letícia Cunha | Nutrição
          </Link>
          <a
            href="#consulta"
            className="rounded-full border border-olive-700/20 px-4 py-2 text-sm font-medium text-graphite transition hover:border-olive-700 hover:bg-olive-700 hover:text-white"
          >
            Consultar fila
          </a>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:py-12">
        <div className="order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/45 shadow-soft">
            <Image
              src="/leticia2.jpeg"
              alt="Letícia Cunha"
              width={3024}
              height={4032}
              priority
              className="h-[410px] w-full object-cover object-[center_24%] sm:h-[560px] lg:h-[690px]"
              sizes="(min-width: 1024px) 48vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite/80 via-graphite/20 to-transparent p-6 text-white sm:p-8">
              <p className="max-w-sm text-sm font-medium uppercase tracking-[0.18em] text-olive-100">
                Nutrição clínica, estética e performance
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 flex flex-col justify-center lg:order-2">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-full bg-olive-100 px-4 py-2 text-sm font-semibold text-olive-800">
              Agenda em preparação
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-graphite sm:text-5xl lg:text-6xl">
              Entre na lista de prioridade para ser avisado assim que novas vagas abrirem.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-graphite/72">
              Para garantir um atendimento humanizado, estratégico e individualizado,
              a agenda da Letícia Cunha está em preparação. Cadastre-se para manter
              sua prioridade e acompanhe sua posição na fila em tempo real.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-olive-500/25 bg-olive-50 px-5 py-4 text-olive-900">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] opacity-75">
              Previsão de início
            </p>
            <p className="mt-2 text-base font-medium leading-7">
              Os atendimentos estão previstos para começar entre janeiro e fevereiro
              de 2027. A lista organiza os interessados por ordem de cadastro.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item}
                className="border-l-2 border-olive-500 bg-white/40 px-4 py-3 text-sm font-medium text-graphite/78"
              >
                {item}
              </div>
            ))}
          </div>

          <div id="consulta" className="mt-10 scroll-mt-28">
            <WaitlistBox />
          </div>
        </div>
      </section>
    </main>
  );
}
