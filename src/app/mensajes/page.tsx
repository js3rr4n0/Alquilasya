import type { Metadata } from "next";
import { Suspense } from "react";
import { Chat } from "@/views/Chat";

export const metadata: Metadata = { title: "Mensajes", robots: { index: false } };

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Chat />
    </Suspense>
  );
}
