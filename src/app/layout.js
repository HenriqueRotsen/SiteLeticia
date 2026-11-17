import localFont from "next/font/local";
import { Gentium_Plus } from "next/font/google";
import "./globals.css";
import DemoBanner from "@/components/layout/DemoBanner";
import PwaSetup from "@/components/pwa/PwaSetup";
import { DialogProvider } from "@/components/ui/ConfirmDialog";
import SplashIntro, { SplashIntroScript } from "@/components/pwa/SplashIntro";
import { splashStartupImages } from "@/lib/pwa/splash-screens";

// Gotham Book = Regular (corpo). Gotham Bold = Negrito (destaques).
const gotham = localFont({
  src: [
    { path: "../fonts/gotham/Gotham-Book.otf", weight: "400", style: "normal" },
    { path: "../fonts/gotham/Gotham-BookItalic.otf", weight: "400", style: "italic" },
    { path: "../fonts/gotham/Gotham-Medium.otf", weight: "500", style: "normal" },
    { path: "../fonts/gotham/Gotham-MediumItalic.otf", weight: "500", style: "italic" },
    { path: "../fonts/gotham/Gotham-Medium.otf", weight: "600", style: "normal" },
    { path: "../fonts/gotham/Gotham-MediumItalic.otf", weight: "600", style: "italic" },
    { path: "../fonts/gotham/Gotham-Bold.otf", weight: "700", style: "normal" },
    { path: "../fonts/gotham/Gotham-BoldItalic.otf", weight: "700", style: "italic" }
  ],
  variable: "--font-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"]
});

const gentiumPlus = Gentium_Plus({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap"
});

export const metadata = {
  title: "Letícia Cunha | Nutricionista",
  description:
    "Nutrição com método, história e cuidado. Letícia Cunha une enfermagem, nutrição e pesquisa clínica para construir estratégias alimentares individualizadas.",
  icons: {
    icon: "/brand-mark.png",
    apple: "/icons/apple-touch-icon.png"
  },
  appleWebApp: {
    capable: true,
    title: "Letícia Cunha",
    // Barra de status transparente: o app (e a abertura) ocupam a tela inteira, sem faixa no topo.
    statusBarStyle: "black-translucent",
    startupImage: splashStartupImages()
  }
};

export const viewport = {
  themeColor: "#FFFFFF",
  viewportFit: "cover"
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <SplashIntroScript />
      </head>
      <body className={`${gotham.variable} ${gentiumPlus.variable} font-sans antialiased`}>
        <div className="lc-statusbar-scrim" aria-hidden="true" />
        <SplashIntro />
        <PwaSetup />
        <DemoBanner />
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
