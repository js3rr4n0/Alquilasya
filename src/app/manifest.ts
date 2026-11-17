import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AlquilasYa · Alquileres en El Salvador",
    short_name: "AlquilasYa",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    lang: "es-SV",
    background_color: "#f5f2eb",
    theme_color: "#0a0a0a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
