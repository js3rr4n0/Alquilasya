import type { Metadata } from "next";
import { Explore } from "@/views/Explore";

export const metadata: Metadata = {
  title: "Explorar alquileres",
  description: "Compara alquileres en El Salvador por costo total, zona, duración y condiciones.",
};

export default function Page() {
  return <Explore />;
}
