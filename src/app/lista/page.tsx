import type { Metadata } from "next";
import { Suspense } from "react";
import { Waitlist } from "@/views/Waitlist";

export const metadata: Metadata = {
  title: "Lista de espera",
  description: "Únete a la lista de espera de AlquilasYa y entra antes del lanzamiento.",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Waitlist />
    </Suspense>
  );
}
