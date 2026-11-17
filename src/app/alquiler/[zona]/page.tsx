import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { ButtonLink, Container } from "@/components/ui";
import type { Listing } from "@/data/types";
import { hasDatabase } from "@/lib/db";
import {
  departmentBySlug,
  departments,
  districtBySlug,
  districtsOf,
  getDepartment,
  getMunicipality,
} from "@/lib/geo";
import { abs } from "@/lib/site";
import { listPublishedIn } from "@/server/listings";

export const revalidate = 300;

type Props = { params: Promise<{ zona: string }> };

function resolve(zona: string) {
  const department = departmentBySlug(zona);
  if (department) return { department, district: undefined };
  const district = districtBySlug(zona);
  if (district) return { department: getDepartment(district.departmentId)!, district };
  return null;
}

async function load(place: NonNullable<ReturnType<typeof resolve>>): Promise<Listing[]> {
  if (!hasDatabase()) return [];
  try {
    return await listPublishedIn(
      place.district ? { districtId: place.district.id } : { department: place.department.name },
    );
  } catch (error) {
    console.error("alquiler/[zona]", error);
    return [];
  }
}

export function generateStaticParams() {
  return departments.map((d) => ({ zona: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { zona } = await params;
  const place = resolve(zona);
  if (!place) return {};
  const name = place.district
    ? `${place.district.name}, ${place.department.name}`
    : place.department.name;
  const listings = await load(place);
  const count = listings.length;
  return {
    title: `Alquiler de casas y apartamentos en ${name}`,
    description: `${count > 0 ? `${count} ${count === 1 ? "alquiler" : "alquileres"}` : "Alquileres"} en ${name}, El Salvador, con precio total, depósito, plano y condiciones por escrito. Sin comisión.`,
    alternates: { canonical: `/alquiler/${zona}` },
    // Un distrito sin anuncios se puede visitar, pero no se pide indexar una página vacía.
    robots: place.district && count === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `Alquileres en ${name} · AlquilasYa`,
      url: `/alquiler/${zona}`,
    },
  };
}

export default async function Page({ params }: Props) {
  const { zona } = await params;
  const place = resolve(zona);
  if (!place) notFound();

  const { department, district } = place;
  const name = district ? district.name : department.name;
  const full = district ? `${district.name}, ${department.name}` : department.name;
  const listings = await load(place);
  const siblings = districtsOf(department.id).filter((d) => d.id !== district?.id);
  const zoneParam = district ? `dis:${district.id}` : `dep:${department.id}`;
  const prices = listings.map((l) => l.prices.mes).filter((p): p is number => Boolean(p));

  const crumbs = [
    { name: "Inicio", url: abs("/") },
    { name: "Alquileres", url: abs("/explorar") },
    { name: department.name, url: abs(`/alquiler/${department.slug}`) },
    ...(district ? [{ name: district.name, url: abs(`/alquiler/${district.slug}`) }] : []),
  ];

  return (
    <div>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: crumbs.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.name,
              item: c.url,
            })),
          },
          ...(listings.length
            ? [
                {
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  name: `Alquileres en ${full}`,
                  numberOfItems: listings.length,
                  itemListElement: listings.map((l, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    url: abs(`/casa/${l.id}`),
                    name: l.title,
                  })),
                },
              ]
            : []),
        ]}
      />

      <section className="on-dark dots bg-negro pb-12 pt-8 text-crema-100">
        <Container>
          <nav aria-label="Ruta" className="text-[14px] text-piedra-300">
            <Link href="/explorar" className="hover:text-crema-100">
              Alquileres
            </Link>
            {" / "}
            {district ? (
              <>
                <Link href={`/alquiler/${department.slug}`} className="hover:text-crema-100">
                  {department.name}
                </Link>
                {" / "}
                <span className="text-crema-100">{district.name}</span>
              </>
            ) : (
              <span className="text-crema-100">{department.name}</span>
            )}
          </nav>
          <h1 className="serif mt-6 max-w-[18ch] text-balance text-[44px] leading-[0.98] sm:text-[64px]">
            Alquileres en <em className="text-terracota-300">{name}</em>
          </h1>
          <p className="mt-5 max-w-[62ch] text-[17px] leading-relaxed text-piedra-300">
            Casas y apartamentos en alquiler en {full}, El Salvador
            {district
              ? ` (municipio de ${getMunicipality(district.municipalityId)?.name})`
              : ""}
            . Cada anuncio dice el precio total, el depósito, el plano y las condiciones antes de
            que le escribas al propietario. Sin comisión.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to={`/explorar?zona=${encodeURIComponent(zoneParam)}`} variant="cream">
              Ver en el mapa con filtros
            </ButtonLink>
            <ButtonLink to="/publicar" variant="outlineLight">
              Publicar gratis en {name}
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Container className="py-12 lg:py-16">
        {listings.length > 0 ? (
          <>
            <p className="text-[16px] text-grafito-700">
              <strong className="font-semibold text-negro">
                {listings.length} {listings.length === 1 ? "alquiler publicado" : "alquileres publicados"}
              </strong>{" "}
              en {full}
              {prices.length > 0 &&
                ` · desde $${Math.min(...prices)} hasta $${Math.max(...prices)} al mes`}
              .
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((l, i) => (
                <ListingCard key={l.id} listing={l} duration="mes" priority={i < 4} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-card bg-crema-050 px-6 py-14 text-center ring-1 ring-arena-200 sm:px-10">
            <h2 className="head text-balance text-[28px]">
              Aún no hay alquileres publicados en {name}.
            </h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-[16px] leading-relaxed text-grafito-600">
              Si tienes una casa o un apartamento aquí, publícalo gratis. Si buscas, revisa los
              otros distritos de {department.name} más abajo.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <ButtonLink to="/publicar" variant="primary">
                Publicar gratis
              </ButtonLink>
            </div>
          </div>
        )}

        <section aria-labelledby="zonas" className="mt-16 border-t border-piedra-250/80 pt-10">
          <h2 id="zonas" className="head text-[26px]">
            {district ? `Otros distritos de ${department.name}.` : `Distritos de ${department.name}.`}
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {siblings.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/alquiler/${d.slug}`}
                  className="inline-flex h-10 items-center rounded-ctl bg-crema-050 px-3.5 text-[15px] text-grafito-700 ring-1 ring-piedra-250 hover:text-negro hover:ring-negro"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="deptos" className="mt-12 border-t border-piedra-250/80 pt-10">
          <h2 id="deptos" className="head text-[26px]">
            Alquileres por departamento.
          </h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {departments.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/alquiler/${d.slug}`}
                  aria-current={d.id === department.id && !district ? "page" : undefined}
                  className="inline-flex h-10 items-center rounded-ctl bg-arena-200 px-3.5 text-[15px] text-grafito-700 hover:text-negro"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </div>
  );
}
