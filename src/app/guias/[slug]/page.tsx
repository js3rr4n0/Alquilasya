import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ButtonLink, Container } from "@/components/ui";
import { getGuide, GUIDES } from "@/data/guides";
import { abs, SITE_NAME, SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guias/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `/guias/${guide.slug}`,
      type: "article",
      modifiedTime: guide.updated,
    },
  };
}

const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es", { dateStyle: "long", timeZone: "UTC" }).format(new Date(iso));

export default async function Page({ params }: Props) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);
  const url = abs(`/guias/${guide.slug}`);

  return (
    <article>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.description,
            dateModified: guide.updated,
            datePublished: guide.updated,
            inLanguage: "es-SV",
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
            publisher: { "@id": `${SITE_URL}/#organizacion` },
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: abs("/") },
              { "@type": "ListItem", position: 2, name: "Guías", item: abs("/guias") },
              { "@type": "ListItem", position: 3, name: guide.title, item: url },
            ],
          },
        ]}
      />

      <header className="on-dark dots bg-negro pb-12 pt-10 text-crema-100">
        <Container>
          <div className="mx-auto max-w-[780px]">
            <nav aria-label="Ruta" className="text-[14px] text-piedra-300">
              <Link href="/guias" className="hover:text-crema-100">
                Guías
              </Link>
            </nav>
            <h1 className="serif mt-5 text-balance text-[38px] leading-[1.02] sm:text-[54px]">
              {guide.title}
            </h1>
            <p className="mt-5 text-[14px] text-piedra-300">Actualizada el {fecha(guide.updated)}</p>
          </div>
        </Container>
      </header>

      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-[780px]">
          {/* La respuesta va primero: es lo que busca quien llega y lo que citan los asistentes. */}
          <p className="serif-text border-l-2 border-terracota-600 pl-5 text-[22px] leading-snug text-negro sm:text-[25px]">
            {guide.answer}
          </p>

          {guide.sections.map((s) => (
            <section key={s.heading} className="mt-12">
              <h2 className="head text-[28px]">{s.heading}</h2>
              {s.paragraphs?.map((p) => (
                <p key={p} className="mt-4 text-[17px] leading-relaxed text-grafito-700">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 space-y-2.5 text-[17px] leading-relaxed text-grafito-700">
                  {s.list.map((item) => (
                    <li key={item} className="grid grid-cols-[20px_1fr]">
                      <span aria-hidden className="text-terracota-600">
                        —
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="mt-14 border-t border-piedra-250 pt-10">
            <h2 className="head text-[28px]">Preguntas frecuentes</h2>
            <dl className="mt-5 divide-y divide-piedra-250/80">
              {guide.faq.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="text-[18px] font-semibold text-negro">{f.q}</dt>
                  <dd className="mt-2 text-[17px] leading-relaxed text-grafito-700">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="mt-12 rounded-card bg-arena-200 p-6 ring-1 ring-piedra-250 sm:p-8">
            <p className="head text-[24px]">Alquileres con todo por escrito.</p>
            <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
              En AlquilasYa cada anuncio dice el precio total, el depósito y las condiciones antes
              del primer mensaje.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink to="/explorar" variant="ink">
                Explorar alquileres
              </ButtonLink>
              <ButtonLink to="/anunciar" variant="outline">
                Publicar gratis
              </ButtonLink>
            </div>
          </div>

          <nav aria-label="Otras guías" className="mt-12">
            <h2 className="text-[14px] font-medium text-grafito-600">Otras guías</h2>
            <ul className="mt-3 space-y-2">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guias/${g.slug}`}
                    className="text-[17px] font-medium text-negro underline decoration-piedra-300 underline-offset-4 hover:decoration-negro"
                  >
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </article>
  );
}
