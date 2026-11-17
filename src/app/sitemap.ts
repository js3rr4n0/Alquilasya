import type { MetadataRoute } from "next";
import { hasDatabase } from "@/lib/db";
import { GUIDES } from "@/data/guides";
import { departments, getDistrict } from "@/lib/geo";
import { abs } from "@/lib/site";
import { publishedIndex } from "@/server/listings";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: abs("/explorar"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: abs("/anunciar"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/guias"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...GUIDES.map((g) => ({
      url: abs(`/guias/${g.slug}`),
      lastModified: new Date(g.updated),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: abs("/privacidad"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...departments.map((d) => ({
      url: abs(`/alquiler/${d.slug}`),
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    })),
  ];

  if (!hasDatabase()) return pages;
  try {
    const published = await publishedIndex();
    // Los distritos entran al sitemap solo cuando tienen al menos un anuncio:
    // una página vacía por distrito no le sirve a nadie ni a Google.
    const seen = new Set<number>();
    for (const l of published) {
      const district = l.district_id ? getDistrict(l.district_id) : undefined;
      if (district && !seen.has(district.id)) {
        seen.add(district.id);
        pages.push({
          url: abs(`/alquiler/${district.slug}`),
          lastModified: new Date(l.updated_at),
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
      pages.push({
        url: abs(`/casa/${l.id}`),
        lastModified: new Date(l.updated_at),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("sitemap", error);
  }
  return pages;
}
