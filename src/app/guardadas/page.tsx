import type { Metadata } from "next";
import { Saved } from "@/views/Saved";

export const metadata: Metadata = { title: "Guardadas", robots: { index: false } };

export default function Page() {
  return <Saved />;
}
