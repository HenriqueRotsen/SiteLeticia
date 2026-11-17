// Manifest da PWA: instala só a área logada (paciente e nutricionista).
// O scope precisa ser "/" porque o login (/entrar, /verificar-codigo) fica na raiz;
// o app sempre abre em /app e o middleware leva a nutricionista para /admin.
export default function manifest() {
  return {
    id: "/app",
    name: "Letícia Cunha Nutrição",
    short_name: "Letícia Cunha",
    description: "Consultas, plano alimentar, exames e evolução com a nutricionista Letícia Cunha.",
    lang: "pt-BR",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#2b1e16",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
