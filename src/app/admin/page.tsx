import type { Metadata } from "next";
import { Admin } from "@/views/Admin";

export const metadata: Metadata = { title: "Moderación", robots: { index: false, follow: false } };

export default function Page() {
  return <Admin />;
}
