#!/usr/bin/env node
/**
 * Gera as telas de abertura do iPhone (apple-touch-startup-image) com o mesmo
 * fundo marrom da animação de abertura (SplashIntro). Assim o app instalado não
 * fica preto enquanto carrega e a animação entra sem emenda.
 *
 * Uso: node scripts/generate-pwa-splash.mjs
 * Os tamanhos ficam em src/lib/pwa/splash-screens.js (usados também no layout).
 */
import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { SPLASH_SCREENS, SPLASH_GRADIENT } from "../src/lib/pwa/splash-screens.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "splash");
mkdirSync(outDir, { recursive: true });

function gradientSvg(width, height) {
  const stops = SPLASH_GRADIENT.stops
    .map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`)
    .join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <radialGradient id="g" cx="0.5" cy="${SPLASH_GRADIENT.cy}" r="${SPLASH_GRADIENT.r}" gradientUnits="objectBoundingBox">${stops}</radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`
  );
}

for (const screen of SPLASH_SCREENS) {
  const width = screen.width * screen.ratio;
  const height = screen.height * screen.ratio;
  await sharp(gradientSvg(width, height))
    .flatten()
    .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(join(outDir, screen.file));
  console.log(screen.file);
}
