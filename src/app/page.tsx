import { JsonLd } from "@/components/JsonLd";
import { abs, FAQ, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import type { Listing } from "@/data/types";
import { hasDatabase } from "@/lib/db";
import { listPublished } from "@/server/listings";
import { Home } from "@/views/Home";

export const revalidate = 300;

/** Los anuncios más recientes van en el HTML: así los ven los buscadores sin ejecutar nada. */
async function latest(): Promise<Listing[]> {
  if (!hasDatabase()) return [];
  try {
    return (await listPublished()).slice(0, 8);
  } catch (error) {
    console.error("home", error);
    return [];
  }
}

export default async function Page() {
  const initial = await latest();
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": `${SITE_URL}/#organizacion`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: abs("/brand/alquilasya-sello-terracota.svg"),
            description: SITE_DESCRIPTION,
            email: "hola@alquilasya.com",
            areaServed: { "@type": "Country", name: "El Salvador" },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "@id": `${SITE_URL}/#sitio`,
            name: SITE_NAME,
            url: SITE_URL,
            inLanguage: "es-SV",
            description: SITE_DESCRIPTION,
            publisher: { "@id": `${SITE_URL}/#organizacion` },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
      <Home initial={initial} />
    </>
  );
}
