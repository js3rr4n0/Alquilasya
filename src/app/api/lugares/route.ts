import { NextResponse } from "next/server";
import { rateLimited } from "@/server/http";

export const dynamic = "force-dynamic";

/**
 * Buscador de lugares para marcar la ubicación al publicar («Metrocentro», «UCA»,
 * «colonia Escalón»…). Solo El Salvador. Usa Photon (OpenStreetMap), que admite
 * buscar mientras se escribe; si falla, Nominatim. Pasa por aquí para identificar
 * al sitio ante esos servicios, frenar abusos y guardar las búsquedas repetidas.
 */

type Place = { name: string; detail: string; lat: number; lng: number };

const UA = "AlquilasYa/1.0 (https://alquilasya.com; contacto@alquilasya.com)";
const BBOX = "-90.2,13.1,-87.6,14.5"; // El Salvador
const cache = new Map<string, { at: number; places: Place[] }>();
const DAY = 24 * 3600 * 1000;

const uniq = (parts: (string | undefined)[]) =>
  parts.filter((p, i, all): p is string => Boolean(p) && all.indexOf(p) === i);

async function photon(q: string, near?: { lat: number; lng: number }): Promise<Place[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("bbox", BBOX);
  url.searchParams.set("limit", "8");
  if (near) {
    url.searchParams.set("lat", String(near.lat));
    url.searchParams.set("lon", String(near.lng));
  }
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`photon ${res.status}`);
  const data = (await res.json()) as {
    features: {
      geometry: { coordinates: [number, number] };
      properties: Record<string, string | undefined>;
    }[];
  };
  return data.features
    .filter((f) => f.properties.countrycode === "SV")
    .map((f) => {
      const p = f.properties;
      const name = p.name ?? uniq([p.street, p.housenumber]).join(" ");
      return {
        name: name || p.locality || p.city || "Lugar",
        detail: uniq([p.street !== name ? p.street : undefined, p.locality, p.district, p.city, p.state])
          .filter((x) => x !== name)
          .slice(0, 3)
          .join(", "),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      };
    });
}

async function nominatim(q: string): Promise<Place[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "sv");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("accept-language", "es");
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = (await res.json()) as {
    name: string;
    display_name: string;
    lat: string;
    lon: string;
    address: Record<string, string | undefined>;
  }[];
  return data.map((x) => {
    const a = x.address;
    return {
      name: x.name || x.display_name.split(",")[0],
      detail: uniq([a.road, a.suburb ?? a.neighbourhood, a.city ?? a.town ?? a.village, a.state]).slice(0, 3).join(", "),
      lat: Number(x.lat),
      lng: Number(x.lon),
    };
  });
}

export async function GET(request: Request) {
  if (rateLimited(request, "lugares", 40)) return NextResponse.json({ places: [] }, { status: 429 });
  const params = new URL(request.url).searchParams;
  const q = (params.get("q") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (q.length < 3) return NextResponse.json({ places: [] });
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  const near = Number.isFinite(lat) && Number.isFinite(lng) && lat && lng ? { lat, lng } : undefined;

  const key = `${q.toLowerCase()}|${near ? `${lat.toFixed(2)},${lng.toFixed(2)}` : ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < DAY) return NextResponse.json({ places: hit.places });

  let places: Place[] = [];
  try {
    places = await photon(q, near);
  } catch {
    places = await nominatim(q).catch(() => []);
  }
  // Sin repetidos (mismo nombre a menos de ~100 m).
  places = places.filter(
    (p, i) => places.findIndex((o) => o.name === p.name && Math.abs(o.lat - p.lat) + Math.abs(o.lng - p.lng) < 0.001) === i,
  );
  if (cache.size > 2000) cache.clear();
  cache.set(key, { at: Date.now(), places });
  return NextResponse.json({ places }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
