import type { Metadata } from "next";
import { Expediente } from "@/views/Expediente";

export const metadata: Metadata = {
  title: "Perfil de inquilino · demostración",
  robots: { index: false },
};

export default function Page() {
  return <Expediente />;
}
