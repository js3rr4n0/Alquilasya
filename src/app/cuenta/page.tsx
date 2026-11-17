import type { Metadata } from "next";
import { Account } from "@/views/Account";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default function Page() {
  return <Account />;
}
