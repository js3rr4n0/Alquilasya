import type { Metadata } from "next";
import { Suspense } from "react";
import { Waitlist } from "@/views/Waitlist";

export const metadata: Metadata = {
  title: "Lista de espera",
  description: "Únete a la lista de espera de AlquilasYa y entra antes del lanzamiento.",
  // Ya no se enlaza desde el sitio; sigue accesible por su dirección, sin aparecer en buscadores.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Waitlist />
    </Suspense>
  );
}
