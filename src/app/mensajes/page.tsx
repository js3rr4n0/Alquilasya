import type { Metadata } from "next";
import { Messages } from "@/views/Messages";

export const metadata: Metadata = { title: "Mensajes · demostración", robots: { index: false } };

export default function Page() {
  return <Messages />;
}
