import type { MetadataRoute } from "next";
import { abs, SITE_URL } from "@/lib/site";

const PRIVATE = ["/api/", "/admin", "/cuenta", "/pago", "/entrar", "/verificar", "/mensajes"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Asistentes y buscadores con IA: bienvenidos a leer el contenido público.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: PRIVATE,
      },
    ],
    sitemap: abs("/sitemap.xml"),
    host: SITE_URL,
  };
}
