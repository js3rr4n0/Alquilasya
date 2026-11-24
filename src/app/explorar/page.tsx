import type { Metadata } from "next";
import { Suspense } from "react";
import { Explore } from "@/views/Explore";

export const metadata: Metadata = {
  title: "Explorar alquileres",
  description: "Compara alquileres en El Salvador por costo total, zona, duración y condiciones.",
  alternates: { canonical: "/explorar" },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Explore />
    </Suspense>
  );
}
