import Link from "next/link";
import WaitlistBox from "@/components/WaitlistBox";
import MarketingShell, { PageHero, SectionEyebrow } from "@/components/marketing/MarketingShell";

export const metadata = {
  title: "Fila de espera | Letícia Cunha",
  description:
    "Entre na lista de prioridade para acompanhamento nutricional e acompanhe sua posição na fila de espera."
};

export default function FilaDeEsperaPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Lista de prioridade"
        title="Entre na fila e acompanhe sua posição."
        description="A ordem de atendimento segue a data de cadastro. Quem já está na lista pode consultar a posição a qualquer momento pelo WhatsApp informado no cadastro."
      />

      <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-8">
        <WaitlistBox />

        <div className="mt-8 rounded-[1.75rem] border border-olive-900/10 bg-white/50 p-6 text-sm leading-7 text-graphite/70">
          <SectionEyebrow>Conta na plataforma</SectionEyebrow>
          <p className="mt-3">
            Depois de ser chamado(a), você poderá criar sua conta completa para acessar dieta, exames, evolução e
            agendamentos.
          </p>
          <Link
            href="/criar-conta"
            className="mt-4 inline-flex rounded-full border border-olive-700/20 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-olive-800 transition hover:bg-olive-50"
          >
            Criar conta na plataforma
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
