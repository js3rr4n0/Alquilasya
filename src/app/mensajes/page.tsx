import type { Metadata } from "next";
import { Suspense } from "react";
import { Messages } from "@/views/Messages";

export const metadata: Metadata = { title: "Mensajes · demostración", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Messages />
    </Suspense>
  );
}
