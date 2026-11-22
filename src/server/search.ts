import { z } from "zod";
import { CONDITION_FILTERS } from "@/data/conditions";
import type { ListingSummary, MapPoint } from "@/data/types";
import { query } from "@/lib/db";
import { approx } from "@/lib/approx";
import { districtsOf, parseZone } from "@/lib/geo";

/**
 * Búsqueda de anuncios publicados, resuelta en la base de datos.
 * La lista llega paginada y con lo justo para cada tarjeta; el mapa recibe
 * solo puntos. Así Explorar no depende de cuántos anuncios haya en total.
 */

export const PAGE_SIZE = 24;
const MAX_POINTS = 2000;

const DURATIONS = ["dia", "semana", "mes", "seis", "anio"] as const;
const TYPES = ["Casa", "Apartamento", "Loft", "Cabaña", "Estudio", "Penthouse"] as const;
const CONDITION_KEYS = CONDITION_FILTERS.map((f) => f.key) as [string, ...string[]];

const list = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").filter(Boolean).slice(0, max) : []));

/** Los filtros tal como llegan en la URL de /api/listings. */
export const searchParams = z.object({
  zona: z.string().max(20).optional().default(""),
  plazo: z.enum(DURATIONS).optional().default("mes"),
  /** "1": solo anuncios que se alquilan por ese plazo. */
  solo: z.enum(["0", "1"]).optional().default("1"),
  tipo: z.enum(TYPES).optional(),
  cuartos: z.coerce.number().int().min(0).max(10).optional().default(0),
  tope: z.coerce.number().min(0).max(1_000_000).optional().default(0),
  condiciones: list(CONDITION_KEYS.length).pipe(z.array(z.enum(CONDITION_KEYS))),
  /** Solo estos ids (guardadas). */
  ids: list(200).pipe(z.array(z.string().max(120))),
  excluir: z.string().max(120).optional(),
  orden: z.enum(["recientes", "menor", "mayor"]).optional().default("recientes"),
  pagina: z.coerce.number().int().min(1).max(500).optional().default(1),
  limite: z.coerce.number().int().min(1).max(PAGE_SIZE).optional().default(PAGE_SIZE),
  mapa: z.enum(["0", "1"]).optional().default("0"),
});

export type SearchParams = z.infer<typeof searchParams>;

/** Arma el WHERE con parámetros numerados; nada del usuario va pegado al SQL. */
function where(p: SearchParams) {
  const params: unknown[] = [p.plazo];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };
  // $1 es siempre el plazo: el precio de ese plazo dentro de la ficha.
  const price = "NULLIF(l.data->'prices'->>$1, '')::numeric";
  // `$1` se nombra siempre, aunque ningún filtro use el precio: Postgres
  // rechaza parámetros enviados que la consulta no usa.
  const parts = ["l.status = 'publicada'", "$1::text IS NOT NULL"];

  const place = parseZone(p.zona);
  if (place?.district) parts.push(`l.district_id = ${add(place.district.id)}`);
  else if (place) {
    parts.push(`l.district_id = ANY(${add(districtsOf(place.department.id).map((d) => d.id))}::int[])`);
  }

  if (p.solo === "1") parts.push(`${price} IS NOT NULL`);
  if (p.tipo) parts.push(`l.type = ${add(p.tipo)}`);
  if (p.cuartos > 0) parts.push(`l.bedrooms >= ${add(p.cuartos)}`);
  if (p.tope > 0) parts.push(`(${price} IS NULL OR ${price} <= ${add(p.tope)})`);
  for (const key of p.condiciones) {
    const rule = CONDITION_FILTERS.find((f) => f.key === key)!;
    parts.push(
      `EXISTS (SELECT 1 FROM jsonb_array_elements(l.data->'conditions') c
                WHERE c->>'key' = ${add(key)} AND c->>'status' = ANY(${add(rule.accept)}::text[]))`,
    );
  }
  if (p.ids.length) parts.push(`l.id = ANY(${add(p.ids)}::text[])`);
  if (p.excluir) parts.push(`l.id <> ${add(p.excluir)}`);

  return { sql: parts.join(" AND "), params, price };
}

type SummaryRow = {
  id: string;
  title: string;
  type: ListingSummary["type"];
  zone: string;
  region: string;
  bedrooms: number;
  bathrooms: string;
  area: string;
  lat: number;
  lng: number;
  cover: string | null;
  prices: ListingSummary["prices"];
  conditions: ListingSummary["conditions"];
  published: string;
  promoted: boolean;
  total: string;
};

export async function searchListings(p: SearchParams) {
  const w = where(p);
  const order =
    p.orden === "menor"
      ? `${w.price} ASC NULLS LAST, l.published_at DESC`
      : p.orden === "mayor"
        ? `${w.price} DESC NULLS LAST, l.published_at DESC`
        : // Los destacados pagados van primero; entre ellos y entre el resto, lo más reciente.
          "(l.featured_until > now()) IS TRUE DESC, l.published_at DESC NULLS LAST, l.created_at DESC";
  const offset = (p.pagina - 1) * p.limite;

  const rows = await query<SummaryRow>(
    `SELECT l.id, l.title, l.type, l.zone, l.region, l.bedrooms, l.bathrooms, l.area, l.lat, l.lng,
            l.data->>'cover' AS cover, l.data->'prices' AS prices, l.data->'conditions' AS conditions,
            COALESCE(l.published_at, l.created_at) AS published,
            (l.featured_until > now()) IS TRUE AS promoted,
            count(*) OVER () AS total
       FROM listings l
      WHERE ${w.sql}
      ORDER BY ${order}
      LIMIT ${p.limite} OFFSET ${offset}`,
    w.params,
  );

  const results: ListingSummary[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    zone: r.zone,
    region: r.region,
    bedrooms: r.bedrooms,
    bathrooms: Number(r.bathrooms),
    area: Number(r.area),
    // Ubicación aproximada (~330 m): el público no recibe la exacta.
    lat: approx(r.lat),
    lng: approx(r.lng),
    cover: r.cover ?? "",
    prices: r.prices ?? {},
    conditions: r.conditions ?? [],
    publishedAt: new Date(r.published).toISOString().slice(0, 10),
    promoted: r.promoted || undefined,
  }));
  let total = Number(rows[0]?.total ?? 0);
  // Una página más allá del final no trae filas ni total: se cuenta aparte.
  if (!rows.length && p.pagina > 1) {
    const c = await query<{ n: string }>(`SELECT count(*) AS n FROM listings l WHERE ${w.sql}`, w.params);
    total = Number(c[0]?.n ?? 0);
  }

  let points: MapPoint[] | undefined;
  if (p.mapa === "1") {
    const pts = await query<{ id: string; title: string; lat: number; lng: number; price: string | null }>(
      `SELECT l.id, l.title, l.lat, l.lng, ${w.price} AS price
         FROM listings l
        WHERE ${w.sql} AND l.lat IS NOT NULL AND l.lng IS NOT NULL
        ORDER BY l.published_at DESC NULLS LAST
        LIMIT ${MAX_POINTS}`,
      w.params,
    );
    points = pts.map((x) => ({
      id: x.id,
      title: x.title,
      lat: approx(x.lat),
      lng: approx(x.lng),
      prices: x.price === null ? {} : { [p.plazo]: Number(x.price) },
    }));
  }

  return {
    results,
    total,
    page: p.pagina,
    pages: Math.max(1, Math.ceil(total / p.limite)),
    points,
  };
}
