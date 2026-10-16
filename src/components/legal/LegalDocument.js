import Link from "next/link";
import MarketingShell, { SectionEyebrow } from "@/components/marketing/MarketingShell";

function LegalSection({ section }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-t border-olive-900/8 pt-8 first:border-t-0 first:pt-0">
      <h2 className="font-display text-2xl leading-snug text-graphite">{section.title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-graphite/75">
        {section.paragraphs?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {section.list ? (
          <ul className="space-y-2 pl-5">
            {section.list.map((item) => (
              <li key={item} className="list-disc marker:text-olive-600">
                {item}
              </li>
            ))}
          </ul>
        ) : null}
        {section.after?.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

export default function LegalDocument({
  title,
  eyebrow,
  intro,
  sections,
  relatedHref,
  relatedLabel
}) {
  return (
    <MarketingShell>
      <section className="border-b border-olive-900/8 bg-linen">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 lg:py-14">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] text-graphite sm:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-8 text-graphite/68">{intro}</p>
          {relatedHref ? (
            <p className="mt-4 text-sm text-graphite/55">
              Consulte também{" "}
              <Link href={relatedHref} className="font-semibold text-olive-700 hover:text-olive-800">
                {relatedLabel}
              </Link>
              .
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8 lg:py-16">
        <div className="rounded-[1.75rem] border border-olive-900/10 bg-white/60 p-7 shadow-card sm:rounded-[2rem] sm:p-9">
          <nav aria-label="Sumário" className="mb-10 rounded-2xl bg-linen/70 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-graphite/45">Sumário</p>
            <ol className="mt-3 space-y-2 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="text-olive-800 hover:text-olive-900 hover:underline">
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-8">
            {sections.map((section) => (
              <LegalSection key={section.id} section={section} />
            ))}
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
