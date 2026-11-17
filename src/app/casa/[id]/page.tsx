import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { JsonLd } from "@/components/JsonLd";
import type { Listing } from "@/data/types";
import { hasDatabase } from "@/lib/db";
import { photoUrl } from "@/lib/photos";
import { abs } from "@/lib/site";
import { currentUser } from "@/server/auth";
import { getListing } from "@/server/listings";
import { ListingPage } from "@/views/ListingPage";

type Props = { params: Promise<{ id: string }> };

/** La ficha tal como la puede ver quien la pide: publicada, o propia si aún está en revisión. */
const load = cache(async (rawId: string): Promise<Listing | null> => {
  const id = decodeURIComponent(rawId);
  if (!hasDatabase()) return null;
  try {
    const user = await currentUser();
    return await getListing(id, user?.id, user?.admin);
  } catch (error) {
    console.error("casa/[id]", error);
    return null;
  }
});

const TYPE: Record<string, string> = {
  Casa: "House",
  Apartamento: "Apartment",
  Loft: "Apartment",
  Estudio: "Apartment",
  Penthouse: "Apartment",
  Cabaña: "House",
};

function priceLine(l: Listing) {
  if (l.prices.mes) return `$${l.prices.mes} al mes`;
  if (l.prices.semana) return `$${l.prices.semana} por semana`;
  if (l.prices.dia) return `$${l.prices.dia} por día`;
  const other = l.prices.seis ?? l.prices.anio;
  return other ? `$${other} al mes` : "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const l = await load(id);
  if (!l) return { title: "Anuncio no disponible", robots: { index: false } };

  const place = `${l.zone}, ${l.region}`;
  const price = priceLine(l);
  const title = `${l.type} en alquiler en ${place}${price ? ` · ${price}` : ""}`;
  const rooms = l.bedrooms ? `${l.bedrooms} ${l.bedrooms === 1 ? "habitación" : "habitaciones"}` : "1 ambiente";
  const description = `${l.title}: ${rooms}, ${l.bathrooms} ${l.bathrooms === 1 ? "baño" : "baños"}, ${l.area} m². ${l.summary} Depósito de $${l.deposit}. Sin comisión.`;
  const indexable = l.status === "publicada";

  return {
    title,
    description: description.slice(0, 300),
    alternates: { canonical: `/casa/${l.id}` },
    // Los anuncios en revisión no se indexan.
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      title,
      description: l.summary,
      url: `/casa/${l.id}`,
      type: "article",
      images: [{ url: photoUrl(l.cover, 1200, 630), width: 1200, height: 630, alt: l.title }],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const l = await load(id);
  if (!l) notFound();

  const published = l.status === "publicada";
  const monthly = l.prices.mes ?? l.prices.seis ?? l.prices.anio;

  return (
    <>
      {published && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: l.title,
            description: l.summary,
            url: abs(`/casa/${l.id}`),
            datePosted: l.publishedAt,
            image: photoUrl(l.cover, 1200, 800),
            mainEntity: {
              "@type": TYPE[l.type] ?? "Accommodation",
              name: l.title,
              numberOfBedrooms: l.bedrooms,
              numberOfBathroomsTotal: l.bathrooms,
              floorSize: { "@type": "QuantitativeValue", value: l.area, unitCode: "MTK" },
              address: {
                "@type": "PostalAddress",
                addressLocality: l.zone,
                addressRegion: l.region,
                addressCountry: "SV",
              },
              geo: { "@type": "GeoCoordinates", latitude: l.lat, longitude: l.lng },
            },
            ...(monthly
              ? {
                  offers: {
                    "@type": "Offer",
                    price: monthly,
                    priceCurrency: "USD",
                    availability: "https://schema.org/InStock",
                    businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
                  },
                }
              : {}),
          }}
        />
      )}
      <ListingPage initial={l} />
    </>
  );
}
