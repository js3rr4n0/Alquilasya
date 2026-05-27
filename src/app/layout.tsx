import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const playfair = Playfair_Display({ subsets: ["latin"], variable: '--font-playfair' });
const dmSans = DM_Sans({ subsets: ["latin"], variable: '--font-dmsans' });

export const metadata: Metadata = {
  title: "AlquilasYa | Lista de Espera",
  description: "Alquilar en El Salvador, sin vueltas. Únete a la waitlist.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${dmSans.variable} font-sans bg-[#F5F2EB]`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
