// Telas de abertura do iPhone (retrato). width/height em pontos CSS, ratio = densidade da tela.
// Gere as imagens com: node scripts/generate-pwa-splash.mjs
export const SPLASH_SCREENS = [
  { width: 440, height: 956, ratio: 3 }, // 16/17 Pro Max
  { width: 430, height: 932, ratio: 3 }, // 14 Pro Max, 15/16 Plus, 15 Pro Max
  { width: 428, height: 926, ratio: 3 }, // 12/13 Pro Max, 14 Plus
  { width: 420, height: 912, ratio: 3 }, // Air
  { width: 414, height: 896, ratio: 3 }, // XS Max, 11 Pro Max
  { width: 414, height: 896, ratio: 2 }, // XR, 11
  { width: 414, height: 736, ratio: 3 }, // 8 Plus
  { width: 402, height: 874, ratio: 3 }, // 16/17 Pro, 17
  { width: 393, height: 852, ratio: 3 }, // 14 Pro, 15, 15 Pro, 16
  { width: 390, height: 844, ratio: 3 }, // 12, 13, 14, 16e
  { width: 375, height: 812, ratio: 3 }, // X, XS, 11 Pro, mini
  { width: 375, height: 667, ratio: 2 } // SE, 8
].map((screen) => ({
  ...screen,
  file: `splash-${screen.width * screen.ratio}x${screen.height * screen.ratio}.jpg`
}));

// Mesmo degradê usado no CSS da animação (#lc-splash em globals.css).
export const SPLASH_GRADIENT = {
  cy: 0.45,
  r: 0.75,
  stops: [
    [0, "#4a3426"],
    [0.55, "#2b1e16"],
    [1, "#140e0a"]
  ]
};

export function splashStartupImages() {
  return SPLASH_SCREENS.map((s) => ({
    url: `/splash/${s.file}`,
    media: `(device-width: ${s.width}px) and (device-height: ${s.height}px) and (-webkit-device-pixel-ratio: ${s.ratio}) and (orientation: portrait)`
  }));
}
