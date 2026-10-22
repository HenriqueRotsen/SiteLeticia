const FILES = {
  gold: "/brand-mark.png",
  dark: "/brand-mark-dark.png",
  cream: "/brand-mark.png",
  white: "/brand-mark.png",
  seal: "/brand-seal.png",
  wordmark: "/brand-wordmark.png",
  lockup: "/brand-lockup.png",
  stack: "/brand-stack.png"
};

export function LcMonogram({
  className = "h-10 w-auto",
  tone = "gold",
  alt = "Letícia Cunha"
}) {
  const src = FILES[tone] || FILES.gold;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`inline-block object-contain ${className}`} />
  );
}

export function BrandWordmark({
  name = "Letícia Cunha",
  subtitle = "Nutricionista",
  className = ""
}) {
  return (
    <span className={`block min-w-0 ${className}`}>
      <span className="block truncate font-display text-lg leading-snug text-graphite sm:text-xl">
        {name}
      </span>
      <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-graphite/45 sm:mt-1 sm:tracking-[0.22em]">
        {subtitle}
      </span>
    </span>
  );
}

export default function BrandMark({
  variant = "mono",
  className = "h-10 w-auto",
  tone = "gold",
  alt = "Letícia Cunha"
}) {
  const src = FILES[variant] || FILES[tone] || FILES.gold;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`inline-block object-contain ${className}`} />
  );
}
