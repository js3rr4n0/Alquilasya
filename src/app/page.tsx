import { JsonLd } from "@/components/JsonLd";
import { abs, FAQ, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { Home } from "@/views/Home";

export default function Page() {
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
      <Home />
    </>
  );
}
