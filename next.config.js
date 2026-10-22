/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://world.openfoodfacts.org https://www.googleapis.com https://oauth2.googleapis.com",
      "frame-src 'self' blob: https://www.google.com https://meet.google.com",
      "child-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join("; ")
  }
];

const nextConfig = {
  images: {
    // WebP: bem mais leve que JPG/PNG e rápido de gerar (AVIF é lento e atrasava as imagens)
    formats: ["image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1280, 1600, 1920, 2400],
    // Em desenvolvimento não guarda cache longo (senão trocar uma imagem em public/ não aparece)
    minimumCacheTTL: process.env.NODE_ENV === "production" ? 60 * 60 * 24 * 30 : 60
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse", "sharp"]
  }
};

module.exports = nextConfig;
