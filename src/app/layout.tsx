import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { Shell } from "@/components/Shell";
import "./globals.css";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..500&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:ital,wdth,wght@0,75..100,400..700;1,75..100,400..700&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://alquilasya.com"),
  title: {
    default: "AlquilasYa · Alquileres en El Salvador, con todo claro antes de entrar",
    template: "%s · AlquilasYa",
  },
  description:
    "Alquileres en El Salvador con el precio total, el depósito, el plano y las condiciones por escrito antes de contactar a nadie. Publicar es gratis.",
  openGraph: {
    title: "AlquilasYa · Todo claro antes de entrar",
    description:
      "Precio total, depósito, plano y condiciones por escrito antes de contactar a nadie. Alquileres en El Salvador.",
    locale: "es_SV",
    type: "website",
    siteName: "AlquilasYa",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
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
