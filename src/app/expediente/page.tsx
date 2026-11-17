import type { Metadata } from "next";
import { Suspense } from "react";
import { Expediente } from "@/views/Expediente";

export const metadata: Metadata = {
  title: "Perfil de inquilino · demostración",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Expediente />
    </Suspense>
  );
}
