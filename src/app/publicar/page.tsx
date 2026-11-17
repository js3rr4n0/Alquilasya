import type { Metadata } from "next";
import { Publish } from "@/views/Publish";

export const metadata: Metadata = {
  title: "Publicar una propiedad",
  description: "Publica tu alquiler gratis: plano, fotos, precio total y condiciones por escrito.",
};

export default function Page() {
  return <Publish />;
}
