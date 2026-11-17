import type { Metadata } from "next";
import { Suspense } from "react";
import { Verify } from "@/views/Verify";

export const metadata: Metadata = { title: "Confirma tu correo", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Verify />
    </Suspense>
  );
}
