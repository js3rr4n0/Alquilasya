import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentResult } from "@/views/PaymentResult";

export const metadata: Metadata = { title: "Tu pago", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" aria-busy="true" />}>
      <PaymentResult />
    </Suspense>
  );
}
