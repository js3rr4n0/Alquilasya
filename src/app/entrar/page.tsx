import type { Metadata } from "next";
import { Suspense } from "react";
import { Auth } from "@/views/Auth";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Auth />
    </Suspense>
  );
}
