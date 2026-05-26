import "./globals.css";

export const metadata = {
  title: "Leticia Cunha | Saúde e Nutrição",
  description:
    "Conheça a trajetória da Leticia Cunha e entre na lista de prioridade para futuros atendimentos."
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
