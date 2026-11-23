import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy (variante sin nonces de la guía de Next.js: con nonces
 * todas las páginas pasarían a generarse en cada visita y se perdería la caché).
 * Solo se permiten los orígenes que el navegador de verdad usa:
 * - Google Fonts (estilos y fuentes)
 * - OpenStreetMap (teselas del mapa), Unsplash (fotos del ejemplo) y Vercel Blob (fotos subidas)
 * - Google Tag/Analytics, solo si se activa NEXT_PUBLIC_GA_ID
 * Vercel Analytics y Speed Insights van por /_vercel (el propio dominio).
 * Wompi no necesita nada: el pago se abre en su sitio, no dentro del nuestro.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://images.unsplash.com https://*.public.blob.vercel-storage.com https://www.googletagmanager.com https://*.google-analytics.com",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // Los pagos dentro del sitio no forman parte del lanzamiento.
      { source: "/casa/:id/pagar", destination: "/casa/:id", permanent: false },
      { source: "/expediente", destination: "/cuenta", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
