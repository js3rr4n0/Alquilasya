import { randomBytes } from "node:crypto";
import { z } from "zod";
import { CONDITION_ORDER } from "@/data/conditions";
import type { Listing, ListingStatus } from "@/data/types";
import { query } from "@/lib/db";
import { sendListingFlagged, mailConfigured } from "./mail";
import { reviewListing } from "./moderation";

/* ——— Validación de lo que llega desde el formulario de publicar ——— */

const text = (max: number) => z.string().trim().max(max);

/** Solo fotos subidas por quien publica (Vercel Blob). No se aceptan fotos de muestra. */
const photo = z
  .string()
  .max(600)
  .refine(
    (v) => /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s]+$/i.test(v),
    "Usa fotos subidas desde tu dispositivo",
  );

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
  x: z.number().min(0).max(1000),
  y: z.number().min(0).max(1000),
  w: z.number().positive().max(1000),
  h: z.number().positive().max(1000),
  photos: z.array(photo).max(12),
  features: z.array(text(60)).max(20).optional(),
  view: z.object({ label: text(120), photo: photo.optional() }).optional(),
  note: text(300).optional(),
});

const floor = z.object({
  id: text(40).min(1),
  name: text(60).min(1),
  width: z.number().positive().max(1000),
  height: z.number().positive().max(1000),
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
  cover: z.union([photo, z.literal("")]),
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
  promoted?: boolean;
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
    promoted: row.promoted || undefined,
  };
}

/** Publicados en un distrito o en todo un departamento (por nombre). */
export async function listPublishedIn(place: { districtId?: number; department?: string }) {
  const rows = await query<ListingRow>(
    `SELECT id, status, data, contact_name, published_at, created_at, (featured_until > now()) IS TRUE AS promoted
       FROM listings
      WHERE status = 'publicada'
        AND ($1::int IS NULL OR district_id = $1)
        AND ($2::text IS NULL OR region = $2)
      ORDER BY (featured_until > now()) IS TRUE DESC, published_at DESC NULLS LAST
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

/** Una ficha por id. Las no publicadas solo las ven quien las subió y el admin. */
export async function getListing(
  id: string,
  userId?: string | null,
  admin = false,
): Promise<Listing | null> {
  const rows = await query<ListingRow & { user_id: string | null }>(
    `SELECT id, status, data, contact_name, published_at, created_at, user_id::text AS user_id,
            (featured_until > now()) IS TRUE AS promoted
       FROM listings WHERE id = $1`,
    [id],
  );
  const row = rows[0];
  if (!row) return null;
  const mine = Boolean(userId) && userId === row.user_id;
  // Lo no publicado lo ve su dueño; el admin también, para poder revisarlo.
  if (row.status !== "publicada" && !mine && !admin) return null;
  return { ...toListing(row), isNew: mine || undefined };
}

type Place = { district: string; municipality: string; department: string };

/** Valida el distrito y arma la ficha y las columnas a partir del formulario. */
async function prepare(input: ListingInput) {
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

  /** Columnas $2…$18, en el orden que usan el INSERT y el UPDATE. */
  const columns = [
    fields.title,
    fields.type,
    place.district,
    place.department,
    bedrooms,
    bathrooms,
    area,
    fields.prices.mes ?? null,
    fields.deposit,
    contact.name,
    contact.whatsapp,
    contact.email || null,
    plan,
    districtId,
    fields.lat,
    fields.lng,
  ];
  // Filtro automático sobre todo lo que escribió la persona (no sobre el contacto).
  const review = reviewListing({ title: fields.title, text: fields, priceMonth: fields.prices.mes ?? null });
  return { data, columns, place, title: fields.title, review };
}

export async function createListing(input: ListingInput, owner: { id: string; email: string }) {
  const { data, columns, place, title, review } = await prepare(input);
  columns[11] ??= owner.email;
  // Sin aprobación manual: lo limpio se publica ya; lo dudoso queda en revisión con su motivo.
  const status: ListingStatus = review.ok ? "publicada" : "pendiente";
  const reason = review.ok ? null : review.reasons.join(" · ");
  const base = slugify(`${title} ${place.district}`);

  for (let attempt = 0; attempt < 5; attempt++) {
    const id = attempt === 0 ? base : `${base}-${randomBytes(2).toString("hex")}`;
    const rows = await query<{ id: string }>(
      `INSERT INTO listings
         (id, title, type, zone, region, bedrooms, bathrooms, area, price_month, deposit,
          contact_name, contact_whatsapp, contact_email, plan, district_id, lat, lng, data, user_id,
          status, review_reason, published_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb,$19,
               $20, $21, CASE WHEN $20 = 'publicada' THEN now() END)
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [id, ...columns, JSON.stringify({ ...data, id }), owner.id, status, reason],
    );
    if (rows[0]) {
      if (!review.ok) await flaggedNotice(owner.email, title, rows[0].id, review.reasons);
      return { id: rows[0].id, status, reasons: review.reasons };
    }
  }
  throw new Error("No se pudo generar un identificador para el anuncio.");
}

/**
 * Edición por su dueño o por el admin. Conserva la dirección (id). El texto nuevo pasa
 * otra vez por el filtro: si queda limpio, un anuncio en revisión se publica solo; si
 * algo suena mal, uno publicado vuelve a revisión. Uno rechazado vuelve a revisión
 * (lo rechazó una persona). Lo que edita el admin no pasa por el filtro.
 */
export async function updateListing(
  id: string,
  input: ListingInput,
  editor: { id: string; email: string; admin?: boolean },
) {
  const { data, columns, review } = await prepare(input);
  const clean = review.ok || Boolean(editor.admin);
  const reason = clean ? null : review.reasons.join(" · ");
  const rows = await query<{ id: string; status: ListingStatus; review_reason: string | null; owner_email: string | null }>(
    `UPDATE listings SET
        title = $2, type = $3, zone = $4, region = $5, bedrooms = $6, bathrooms = $7, area = $8,
        price_month = $9, deposit = $10, contact_name = $11, contact_whatsapp = $12,
        contact_email = $13, plan = $14, district_id = $15, lat = $16, lng = $17,
        data = $18::jsonb,
        status = CASE
                   WHEN status = 'rechazada' THEN 'pendiente'
                   -- Oculto por reportes: solo el admin lo vuelve a publicar.
                   WHEN status = 'pendiente' AND review_reason LIKE 'Reportado por %' AND NOT $20 THEN 'pendiente'
                   WHEN status IN ('publicada', 'pendiente') AND $21 THEN 'publicada'
                   WHEN status = 'publicada' THEN 'pendiente'
                   ELSE status END,
        published_at = CASE WHEN status = 'pendiente' AND $21 THEN COALESCE(published_at, now()) ELSE published_at END,
        review_reason = CASE
                          WHEN status = 'rechazada' THEN review_reason
                          WHEN review_reason LIKE 'Reportado por %' AND NOT $20 THEN review_reason
                          ELSE $22 END,
        edited_at = now(), updated_at = now()
      WHERE id = $1 AND (user_id = $19 OR $20)
      RETURNING id, status, review_reason, (SELECT email FROM users WHERE id = listings.user_id) AS owner_email`,
    // El admin puede corregir cualquier anuncio; el dueño sigue siendo el mismo.
    [id, ...columns, JSON.stringify({ ...data, id }), editor.id, Boolean(editor.admin), clean, reason],
  );
  const row = rows[0];
  if (row && !clean && row.status === "pendiente" && row.owner_email) {
    await flaggedNotice(row.owner_email, data.title, row.id, review.reasons);
  }
  return row ? { id: row.id, status: row.status, reasons: clean ? [] : review.reasons } : null;
}

/** Lo que necesita el formulario para editar: la ficha y los datos de contacto. Solo para su dueño o el admin. */
export async function getListingForEdit(id: string, userId: string, admin = false) {
  const rows = await query<{
    data: Listing;
    status: ListingStatus;
    contact_name: string;
    contact_whatsapp: string;
    contact_email: string | null;
  }>(
    `SELECT data, status, contact_name, contact_whatsapp, contact_email
       FROM listings WHERE id = $1 AND (user_id = $2 OR $3)`,
    [id, userId, admin],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    listing: { ...row.data, id, status: row.status },
    contact: { name: row.contact_name, whatsapp: row.contact_whatsapp, email: row.contact_email ?? "" },
  };
}

/** Correo al dueño con lo que el filtro marcó. Si el correo falla, el anuncio igual queda guardado. */
async function flaggedNotice(to: string, title: string, id: string, reasons: string[]) {
  if (!mailConfigured()) return;
  await sendListingFlagged(to, title, id, reasons).catch((error) => console.error("aviso de filtro", error));
}

/** Error que se puede mostrar tal cual a quien envía el formulario. */
export class InputError extends Error {}

/* ——— Panel de quien publica ——— */

export async function accountOverview(userId: string) {
  const listings = await query(
    `SELECT id, status, title, type, zone, region, price_month, created_at, published_at, edited_at, featured_until, review_reason
       FROM listings WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  const payments = await query(
    `SELECT id, listing_id, listing_title, plan, days, amount, status, created_at, paid_at
       FROM payments WHERE user_id = $1 AND status = 'pagada' ORDER BY created_at DESC LIMIT 30`,
    [userId],
  );
  return { listings, payments };
}

/** Quien publica puede pausar, reactivar (vuelve a salir al instante) o borrar su anuncio. */
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
      : `UPDATE listings SET status = CASE WHEN review_reason IS NULL THEN 'publicada' ELSE 'pendiente' END,
                updated_at = now()
          WHERE id = $1 AND user_id = $2 AND status = 'pausada' RETURNING id`,
    [id, userId],
  );
  return Boolean(rows[0]);
}

/* ——— Moderación ——— */

export async function adminOverview() {
  const [listings, users, waitlist, totals] = await Promise.all([
    query(
      `SELECT l.id, l.status, l.title, l.type, l.zone, l.region, l.price_month, l.contact_name,
              l.contact_whatsapp, l.contact_email, l.created_at, l.published_at, l.edited_at, l.featured_until, l.review_reason, u.email AS owner_email
         FROM listings l LEFT JOIN users u ON u.id = l.user_id
        ORDER BY l.created_at DESC LIMIT 200`,
    ),
    query(
      `SELECT u.id::text AS id, u.email, u.name, u.whatsapp, u.created_at,
              (u.email_verified_at IS NOT NULL) AS verified,
              (SELECT count(*)::int FROM listings l WHERE l.user_id = u.id) AS listings
         FROM users u ORDER BY u.created_at DESC LIMIT 200`,
    ),
    query(
      `SELECT nombre, email, whatsapp, tipo_usuario, departamento, origen, created_at
         FROM waitlist ORDER BY created_at DESC LIMIT 500`,
    ),
    // Monitoreo: totales y actividad de los últimos 7 días. Del chat solo se cuenta, no se lee.
    query(
      `SELECT
        (SELECT count(*)::int FROM users) AS users,
        (SELECT count(*)::int FROM users WHERE email_verified_at IS NOT NULL) AS users_verified,
        (SELECT count(*)::int FROM users WHERE created_at > now() - interval '7 days') AS users_week,
        (SELECT count(*)::int FROM listings) AS listings,
        (SELECT count(*)::int FROM listings WHERE status = 'publicada') AS listings_published,
        (SELECT count(*)::int FROM listings WHERE status = 'pendiente') AS listings_pending,
        (SELECT count(*)::int FROM listings WHERE created_at > now() - interval '7 days') AS listings_week,
        (SELECT count(*)::int FROM conversations) AS conversations,
        (SELECT count(*)::int FROM messages) AS messages,
        (SELECT count(*)::int FROM messages WHERE created_at > now() - interval '7 days') AS messages_week,
        (SELECT count(*)::int FROM waitlist) AS waitlist,
        (SELECT count(*)::int FROM waitlist WHERE tipo_usuario = 'propietario') AS waitlist_owners,
        (SELECT count(DISTINCT listing_id)::int FROM reports WHERE status = 'abierto') AS reports_open`,
    ),
  ]);
  return { listings, users, waitlist, totals: totals[0] };
}

export async function setListingStatus(id: string, status: ListingStatus) {
  const rows = await query<{ id: string }>(
    `UPDATE listings
        SET status = $2,
            updated_at = now(),
            published_at = CASE WHEN $2 = 'publicada' THEN COALESCE(published_at, now()) ELSE published_at END,
            review_reason = CASE WHEN $2 = 'publicada' THEN NULL ELSE review_reason END
      WHERE id = $1
      RETURNING id`,
    [id, status],
  );
  return Boolean(rows[0]);
}

/**
 * Destacado manual desde admin (cortesía o corrección), sin cobro. Con días > 0
 * publica el anuncio si estaba en revisión y suma los días; con 0 lo quita.
 */
export async function setFeatured(id: string, days: number) {
  const rows = await query<{ id: string }>(
    days > 0
      ? `UPDATE listings
            SET featured_until = GREATEST(COALESCE(featured_until, now()), now()) + make_interval(days => $2),
                status = CASE WHEN status = 'pendiente' THEN 'publicada' ELSE status END,
                published_at = CASE WHEN status = 'pendiente' THEN COALESCE(published_at, now()) ELSE published_at END,
                review_reason = CASE WHEN status = 'pendiente' THEN NULL ELSE review_reason END,
                updated_at = now()
          WHERE id = $1 RETURNING id`
      : `UPDATE listings SET featured_until = NULL, updated_at = now() WHERE id = $1 AND $2 = 0 RETURNING id`,
    [id, days],
  );
  return Boolean(rows[0]);
}
