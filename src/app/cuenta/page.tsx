import type { Metadata } from "next";
import { Suspense } from "react";
import { Account } from "@/views/Account";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <Account />
    </Suspense>
  );
}
