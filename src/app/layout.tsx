import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Shell } from "@/components/Shell";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..500&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..700&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AlquilasYa · Alquiler de casas y apartamentos en El Salvador",
    template: "%s · AlquilasYa",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "alquiler El Salvador",
    "casas en alquiler El Salvador",
    "apartamentos en alquiler San Salvador",
    "alquiler de casas San Salvador",
    "alquiler Santa Tecla",
    "alquiler Antiguo Cuscatlán",
    "apartamentos amueblados El Salvador",
    "alquiler sin comisión",
    "alquiler directo con dueño",
    "publicar casa en alquiler gratis",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "AlquilasYa · Todo claro antes de entrar",
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "es_SV",
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: { card: "summary_large_image", title: "AlquilasYa", description: SITE_DESCRIPTION },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  // Código de Google Search Console (variable GOOGLE_SITE_VERIFICATION).
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  category: "real estate",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-SV">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[3000] focus:rounded-ctl focus:bg-crema-100 focus:px-4 focus:py-2 focus:text-[15px] focus:font-medium focus:text-negro"
        >
          Saltar al contenido
        </a>
        <Shell>{children}</Shell>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#0a0a0a",
              color: "#f5f2eb",
              border: "1px solid rgb(245 242 235 / 0.15)",
              borderRadius: "6px",
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
            },
          }}
        />
      </body>
    </html>
  );
}
