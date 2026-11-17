import type { Metadata } from "next";
import { ListingPage } from "@/views/ListingPage";

export const metadata: Metadata = { title: "Ficha de la propiedad" };

export default function Page() {
  return <ListingPage />;
}
