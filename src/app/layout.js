import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import DemoBanner from "@/components/layout/DemoBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
  display: "swap"
});

export const metadata = {
  title: "Leticia Cunha | Saúde e Nutrição",
  description:
    "Plataforma de acompanhamento nutricional da Letícia Cunha — consultas, dieta, exames e evolução."
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
