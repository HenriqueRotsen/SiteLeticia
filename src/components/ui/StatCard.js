import Link from "next/link";

export default function StatCard({ label, value, hint, icon: Icon, tone = "olive", href }) {
  const tones = {
    olive: "bg-[#BD9B72]/15 text-[#BD9B72]",
    sand: "bg-linen text-[#BD9B72]",
    amber: "bg-amber-50 text-amber-700",
    linen: "bg-linen text-[#BD9B72]"
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-graphite/55">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-graphite sm:text-3xl">{value}</p>
          {hint ? <p className="mt-1 text-xs text-graphite/45">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
      {href ? <p className="mt-3 text-xs font-semibold text-[#BD9B72]">Ver detalhes →</p> : null}
    </>
  );

  const className = href
    ? "group block cursor-pointer rounded-2xl border border-olive-900/10 bg-porcelain/95 p-5 shadow-card transition hover:-translate-y-0.5 hover:border-[#BD9B72]/40 hover:shadow-card-hover"
    : "block rounded-2xl border border-olive-900/10 bg-porcelain/95 p-5 shadow-card";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
