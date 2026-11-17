import { randomBytes } from "node:crypto";
import { z } from "zod";
import { CONDITION_ORDER } from "@/data/conditions";
import type { Listing, ListingStatus } from "@/data/types";
import { query } from "@/lib/db";

/* ——— Validación de lo que llega desde el formulario de publicar ——— */

const text = (max: number) => z.string().trim().max(max);

/** Clave de foto de muestra, id de Unsplash o URL https (subida a Blob). */
const photo = z
  .string()
  .max(600)
  .refine((v) => /^[A-Za-z0-9_-]{1,80}$/.test(v) || /^https:\/\/[^\s]+$/.test(v), "Foto inválida");

const ROOM_TYPES = [
  "sala",
  "comedor",
  "cocina",
  "dormitorio",
  "bano",
  "estudio",
  "terraza",
  "balcon",
  "jardin",
  "patio",
  "piscina",
  "lavanderia",
  "cochera",
  "pasillo",
  "muelle",
  "bodega",
] as const;

const room = z.object({
  id: text(40).min(1),
  type: z.enum(ROOM_TYPES),
  name: text(60).min(1),
  x: z.number().min(0).max(200),
  y: z.number().min(0).max(200),
  w: z.number().min(0.5).max(200),
  h: z.number().min(0.5).max(200),
  photos: z.array(photo).max(12),
  features: z.array(text(60)).max(20).optional(),
  view: z.object({ label: text(120), photo: photo.optional() }).optional(),
  note: text(300).optional(),
});

const floor = z.object({
  id: text(40).min(1),
  name: text(60).min(1),
  width: z.number().min(2).max(200),
  height: z.number().min(2).max(200),
  rooms: z.array(room).min(1).max(40),
});

const price = z.number().min(1).max(100000);

export const listingInput = z.object({
  title: text(80).min(3, "Ponle un nombre a la propiedad"),
  type: z.enum(["Casa", "Apartamento", "Loft", "Cabaña", "Estudio", "Penthouse"]),
  districtId: z.number().int().positive(),
  colonia: text(80).optional(),
  lat: z.number().min(12.9).max(14.6),
  lng: z.number().min(-90.3).max(-87.5),
  cover: photo,
  summary: text(200).min(10, "Describe la propiedad en una frase"),
  description: text(3000),
  prices: z
    .object({
      dia: price.optional(),
      semana: price.optional(),
      mes: price.optional(),
      seis: price.optional(),
      anio: price.optional(),
    })
    .refine((p) => Object.values(p).some((v) => v !== undefined), "Indica al menos un precio"),
  deposit: z.number().min(0).max(100000),
  includes: z
    .array(z.object({ label: text(60).min(1), included: z.boolean(), note: text(120).optional() }))
    .max(20),
  conditions: z
    .array(
      z.object({
        key: z.enum(CONDITION_ORDER as [string, ...string[]]),
        status: z.enum(["si", "parcial", "no"]),
        value: text(60).min(1),
        detail: text(300).optional(),
      }),
    )
    .length(CONDITION_ORDER.length, "Responde las once condiciones"),
  rules: z.array(text(200).min(1)).max(20),
  floors: z.array(floor).min(1).max(4),
  availableFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  plan: z.enum(["gratis", "7d", "30d"]).default("gratis"),
  contact: z.object({
    name: text(80).min(2, "Escribe tu nombre"),
    whatsapp: z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "Número de WhatsApp inválido"),
    email: z.union([z.string().email("Correo inválido").max(255), z.literal("")]).optional(),
  }),
});

export type ListingInput = z.infer<typeof listingInput>;

/* ——— Lectura y escritura ——— */

type ListingRow = {
  id: string;
  status: ListingStatus;
  data: Listing;
  contact_name: string;
  published_at: string | null;
  created_at: string;
};

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "propiedad"
  );
}

const day = (value: string | Date) => new Date(value).toISOString().slice(0, 10);

function toListing(row: ListingRow): Listing {
  return {
    ...row.data,
    id: row.id,
    status: row.status,
    contactName: row.contact_name,
    publishedAt: day(row.published_at ?? row.created_at),
  };
}

export async function listPublished(): Promise<Listing[]> {
  const rows = await query<ListingRow>(
    `SELECT id, status, data, contact_name, published_at, created_at
       FROM listings
      WHERE status = 'publicada'
      ORDER BY published_at DESC NULLS LAST
      LIMIT 200`,
  );
  return rows.map(toListing);
}

/** Publicados en un distrito o en todo un departamento (por nombre). */
export async function listPublishedIn(place: { districtId?: number; department?: string }) {
  const rows = await query<ListingRow>(
    `SELECT id, status, data, contact_name, published_at, created_at
       FROM listings
      WHERE status = 'publicada'
        AND ($1::int IS NULL OR district_id = $1)
        AND ($2::text IS NULL OR region = $2)
      ORDER BY published_at DESC NULLS LAST
      LIMIT 60`,
    [place.districtId ?? null, place.department ?? null],
  );
  return rows.map(toListing);
}

/** Lo mínimo de cada publicado, para el sitemap y para saber qué zonas tienen oferta. */
export async function publishedIndex() {
  return query<{ id: string; district_id: number | null; region: string; updated_at: string }>(
    `SELECT id, district_id, region, updated_at FROM listings WHERE status = 'publicada'
      ORDER BY updated_at DESC LIMIT 5000`,
  );
}

/** Una ficha por id. Las no publicadas solo las ve quien las subió. */
export async function getListing(id: string, userId?: string | null): Promise<Listing | null> {
  const rows = await query<ListingRow & { user_id: string | null }>(
    `SELECT id, status, data, contact_name, published_at, created_at, user_id::text AS user_id
       FROM listings WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const mine = Boolean(userId) && userId === row.user_id;
  if (row.status !== "publicada" && !mine) return null;
  return { ...toListing(row), isNew: mine || undefined };
}

type Place = { district: string; municipality: string; department: string };

export async function createListing(
  input: ListingInput,
  owner: { id: string; email: string },
) {
  const { contact, plan, districtId, ...fields } = input;
  const places = await query<Place>(
    `SELECT d.name AS district, m.name AS municipality, p.name AS department
       FROM districts d
       JOIN municipalities m ON m.id = d.municipality_id
       JOIN departments p ON p.id = m.department_id
      WHERE d.id = $1`,
    [districtId],
  );
  const place = places[0];
  if (!place) throw new InputError("Elige el distrito donde está la propiedad.");

  const rooms = fields.floors.flatMap((f) => f.rooms);
  const outdoor = new Set(["terraza", "balcon", "jardin", "patio", "piscina", "cochera", "muelle"]);
  const bedrooms = rooms.filter((r) => r.type === "dormitorio").length;
  const bathrooms = Math.max(1, rooms.filter((r) => r.type === "bano").length);
  const area = Math.round(
    rooms.reduce((sum, r) => sum + (outdoor.has(r.type) ? 0 : r.w * r.h), 0),
  );

  // Todo lo que suena a respaldo de AlquilasYa lo decide el servidor, nunca el formulario.
  const data: Omit<Listing, "id"> = {
    ...fields,
    zone: place.district,
    region: place.department,
    municipality: place.municipality,
    districtId,
    colonia: fields.colonia || undefined,
    conditions: fields.conditions as Listing["conditions"],
    bedrooms,
    bathrooms,
    area,
    ownerId: "anunciante",
    verified: { identity: false, deed: false },
    rating: { score: 0, count: 0, fidelity: 0 },
    reviews: [],
    promoted: false,
    instantApproval: false,
    nearby: [],
    publishedAt: day(new Date()),
  };

  const base = slugify(`${fields.title} ${place.district}`);

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = attempt === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    const rows = await query<{ id: string }>(
      `INSERT INTO listings
         (id, title, type, zone, region, bedrooms, bathrooms, area, price_month, deposit,
          data, contact_name, contact_whatsapp, contact_email, plan, user_id, district_id, lat, lng)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [
        id,
        fields.title,
        fields.type,
        place.district,
        place.department,
        bedrooms,
        bathrooms,
        area,
        fields.prices.mes ?? null,
        fields.deposit,
        JSON.stringify({ ...data, id }),
        contact.name,
        contact.whatsapp,
        contact.email || owner.email,
        plan,
        owner.id,
        districtId,
        fields.lat,
        fields.lng,
      ],
    );
    if (rows[0]) return { id: rows[0].id };
  }
  throw new Error("No se pudo generar un identificador para el anuncio.");
}

/** Error que se puede mostrar tal cual a quien envía el formulario. */
export class InputError extends Error {}

/* ——— Panel de quien publica ——— */

export async function accountOverview(userId: string) {
  const [listings, inquiries] = await Promise.all([
    query(
      `SELECT id, status, title, type, zone, region, price_month, created_at, published_at
         FROM listings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    ),
    query(
      `SELECT q.id, q.listing_id, q.listing_title, q.nombre, q.whatsapp, q.mensaje, q.plazo,
              q.desde, q.created_at
         FROM inquiries q JOIN listings l ON l.id = q.listing_id
        WHERE l.user_id = $1
        ORDER BY q.created_at DESC LIMIT 200`,
      [userId],
    ),
  ]);
  return { listings, inquiries };
}

/** Quien publica puede pausar, reactivar (vuelve a revisión) o borrar su anuncio. */
export async function ownerAction(userId: string, id: string, action: "pausar" | "reactivar" | "borrar") {
  if (action === "borrar") {
    const rows = await query<{ id: string }>(
      "DELETE FROM listings WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, userId],
    );
    return Boolean(rows[0]);
  }
  const rows = await query<{ id: string }>(
    action === "pausar"
      ? `UPDATE listings SET status = 'pausada', updated_at = now()
          WHERE id = $1 AND user_id = $2 AND status = 'publicada' RETURNING id`
      : `UPDATE listings SET status = 'pendiente', updated_at = now()
          WHERE id = $1 AND user_id = $2 AND status = 'pausada' RETURNING id`,
    [id, userId],
  );
  return Boolean(rows[0]);
}

/* ——— Mensajes a quien publica ——— */

export const inquiryInput = z.object({
  listingId: text(120).min(1),
  listingTitle: text(120).min(1),
  example: z.boolean().default(false),
  nombre: text(80).min(2, "Escribe tu nombre"),
  whatsapp: z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "Número de WhatsApp inválido"),
  mensaje: text(1500).min(5, "Escribe tu mensaje"),
  plazo: z.enum(["dia", "semana", "mes", "seis", "anio"]).optional(),
  desde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type InquiryInput = z.infer<typeof inquiryInput>;

/**
 * Guarda el mensaje y, si el anuncio es real y está publicado, devuelve el
 * WhatsApp de quien publicó para seguir la conversación directamente.
 */
export async function createInquiry(input: InquiryInput) {
  let owner: { name: string; whatsapp: string } | null = null;
  let example = input.example;

  if (!example) {
    const rows = await query<{ contact_name: string; contact_whatsapp: string; status: string }>(
      `SELECT contact_name, contact_whatsapp, status FROM listings WHERE id = $1`,
      [input.listingId],
    );
    const row = rows[0];
    if (!row) example = true;
    else if (row.status === "publicada")
      owner = { name: row.contact_name, whatsapp: row.contact_whatsapp };
  }

  await query(
    `INSERT INTO inquiries (listing_id, listing_title, is_example, nombre, whatsapp, mensaje, plazo, desde)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      input.listingId,
      input.listingTitle,
      example,
      input.nombre,
      input.whatsapp,
      input.mensaje,
      input.plazo ?? null,
      input.desde ?? null,
    ],
  );
  return { owner };
}

/* ——— Moderación ——— */

export async function adminOverview() {
  const [listings, inquiries, waitlist] = await Promise.all([
    query(
      `SELECT id, status, title, type, zone, price_month, contact_name, contact_whatsapp,
              contact_email, plan, created_at, published_at
         FROM listings ORDER BY created_at DESC LIMIT 200`,
    ),
    query(
      `SELECT id, listing_id, listing_title, is_example, nombre, whatsapp, mensaje, plazo, desde, created_at
         FROM inquiries ORDER BY created_at DESC LIMIT 200`,
    ),
    query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE tipo_usuario = 'propietario')::int AS propietarios,
              COUNT(*) FILTER (WHERE tipo_usuario = 'inquilino')::int AS inquilinos
         FROM waitlist`,
    ),
  ]);
  return { listings, inquiries, waitlist: waitlist[0] ?? { total: 0, propietarios: 0, inquilinos: 0 } };
}

export async function setListingStatus(id: string, status: ListingStatus) {
  const rows = await query<{ id: string }>(
    `UPDATE listings
        SET status = $2,
            updated_at = now(),
            published_at = CASE WHEN $2 = 'publicada' THEN COALESCE(published_at, now()) ELSE published_at END
      WHERE id = $1
      RETURNING id`,
    [id, status],
  );
  return Boolean(rows[0]);
}
