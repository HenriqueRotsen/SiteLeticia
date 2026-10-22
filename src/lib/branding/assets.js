import fs from "fs";
import path from "path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const HERO_CANDIDATES = ["hero-home.jpg", "hero-home.jpeg", "hero-home.webp", "hero-home.png"];
const MARK_CANDIDATES = ["brand-mark.png", "brand-mark.webp", "brand-mark.svg"];

function firstExisting(files, fallback) {
  for (const file of files) {
    if (fs.existsSync(path.join(PUBLIC_DIR, file))) return `/${file}`;
  }
  return fallback;
}

/** Foto do hero: coloque o arquivo em public/hero-home.jpg (ou .jpeg/.webp/.png). */
export function resolveHeroHomeSrc() {
  return firstExisting(HERO_CANDIDATES, "/leticia1.jpeg");
}

/** Monograma oficial: public/brand-mark.png (ouro). */
export function resolveBrandMarkSrc() {
  return firstExisting(MARK_CANDIDATES, "/brand-mark.svg");
}

export function isOfficialHeroPhoto() {
  return HERO_CANDIDATES.some((file) => fs.existsSync(path.join(PUBLIC_DIR, file)));
}
