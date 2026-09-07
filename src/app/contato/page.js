import Link from "next/link";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/marketing/ContactForm";
import MarketingShell, { PageHero, SectionEyebrow } from "@/components/marketing/MarketingShell";
import { contactReasons, instagramLink, site, whatsappLink } from "@/lib/marketing/content";

export const metadata = {
  title: "Contato | Letícia Cunha",
  description: "Entre em contato com Letícia Cunha para consultas, dúvidas, parcerias e convites acadêmicos."
};

export default function ContatoPage() {
  return (
    <MarketingShell>
      <PageHero
        eyebrow="Contato"
        title="Vamos conversar sobre o seu próximo passo."
        description="Use o formulário ou os canais abaixo. Para agendamentos e lista de prioridade, você também pode criar sua conta na plataforma."
      />

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal variant="left">
            <div className="rounded-[2rem] border border-olive-900/10 bg-white/50 p-7 shadow-card sm:p-9">
              <SectionEyebrow>Enviar mensagem</SectionEyebrow>
              <p className="mt-4 text-sm leading-7 text-graphite/65">
                O formulário abre uma conversa no WhatsApp com sua mensagem já preenchida.
              </p>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </Reveal>

          <Reveal variant="right" className="space-y-5">
            <div className="rounded-[1.75rem] border border-olive-900/10 bg-white/45 p-7">
              <SectionEyebrow>Canais diretos</SectionEyebrow>
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">WhatsApp</dt>
                  <dd className="mt-2">
                    <a
                      href={whatsappLink(site.whatsapp, "Olá, Letícia! Gostaria de mais informações.")}
                      className="font-semibold text-olive-800 underline decoration-olive-900/20 underline-offset-4"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir conversa
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">E-mail</dt>
                  <dd className="mt-2">
                    <a href={`mailto:${site.email}`} className="font-semibold text-graphite hover:text-olive-800">
                      {site.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">Instagram</dt>
                  <dd className="mt-2">
                    <a
                      href={instagramLink(site.instagram)}
                      className="font-semibold text-graphite hover:text-olive-800"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{site.instagram.replace(/^@/, "")}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45">Local</dt>
                  <dd className="mt-2 text-graphite/70">{site.city}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-[1.75rem] bg-graphite p-7 text-porcelain">
              <SectionEyebrow tone="inverse">Lista de espera</SectionEyebrow>
              <p className="mt-4 text-sm leading-7 text-porcelain/75">
                A agenda de novos pacientes está em preparação. Entre na fila de prioridade e acompanhe sua posição
                pelo WhatsApp cadastrado.
              </p>
              <Link
                href="/fila-de-espera"
                className="interactive-lift mt-5 inline-flex rounded-full bg-olive-500 px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white"
              >
                Entrar na fila
              </Link>
            </div>

            <div className="rounded-[1.75rem] border border-olive-900/10 bg-linen/70 p-7">
              <SectionEyebrow>Posso ajudar com</SectionEyebrow>
              <ul className="mt-5 space-y-3">
                {contactReasons.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-graphite/70">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-olive-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </MarketingShell>
  );
}
