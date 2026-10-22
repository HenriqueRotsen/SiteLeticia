import localFont from "next/font/local";
import { Gentium_Plus } from "next/font/google";
import "./globals.css";
import DemoBanner from "@/components/layout/DemoBanner";

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
    apple: "/brand-seal.png"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${gotham.variable} ${gentiumPlus.variable} font-sans antialiased`}>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
