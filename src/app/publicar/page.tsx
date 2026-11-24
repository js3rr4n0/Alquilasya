import type { Metadata } from "next";
import { Suspense } from "react";
import { Publish } from "@/views/Publish";

export const metadata: Metadata = {
  title: "Publicar una propiedad",
  description: "Publica tu alquiler gratis: plano, fotos, precio total y condiciones por escrito.",
  // Es el formulario (pide cuenta); la página pública para buscadores es /anunciar.
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Publish />
    </Suspense>
  );
}
