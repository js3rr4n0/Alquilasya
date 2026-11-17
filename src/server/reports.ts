import { createHmac } from "node:crypto";
import { z } from "zod";
import { query } from "@/lib/db";
import { AuthError, type User } from "./auth";
import { mailConfigured, sendListingHiddenByReports, sendReportToAdmin } from "./mail";

/**
 * Reportes de anuncios. Cualquiera puede reportar (con o sin cuenta), una vez por
 * anuncio. Con 3 personas distintas reportando, el anuncio se oculta solo hasta
 * que el admin lo revise.
 */

export const REPORT_REASONS = {
  estafa: "Parece estafa o piden dinero antes de ver",
  no_existe: "No existe o ya no está disponible",
  datos_falsos: "Precio, fotos o datos falsos",
  ofensivo: "Contenido ofensivo o discriminatorio",
  otro: "Otro motivo",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

export const reportInput = z.object({
  listingId: z.string().min(1).max(120),
  reason: z.enum(Object.keys(REPORT_REASONS) as [ReportReason, ...ReportReason[]]),
  details: z.string().trim().max(600).optional(),
});

/** Con cuántas personas distintas se oculta un anuncio automáticamente. */
export const HIDE_AT = 3;

const ipKey = (ip: string) =>
  createHmac("sha256", process.env.ANALYTICS_SECRET || `${process.env.DATABASE_URL ?? ""}:reportes`)
    .update(ip)
    .digest("base64url")
    .slice(0, 22);

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

export async function createReport(input: z.infer<typeof reportInput>, user: User | null, ip: string) {
  const [listing] = await query<{ id: string; title: string; status: string; user_id: string | null; owner_email: string | null }>(
    `SELECT l.id, l.title, l.status, l.user_id::text AS user_id, u.email AS owner_email
       FROM listings l LEFT JOIN users u ON u.id = l.user_id WHERE l.id = $1`,
    [input.listingId],
  );
  if (!listing || listing.status !== "publicada") throw new AuthError("Este anuncio ya no está publicado.", 404);
  if (user && listing.user_id === user.id) throw new AuthError("No puedes reportar tu propio anuncio.");

  const key = user ? `u:${user.id}` : `ip:${ipKey(ip || "desconocida")}`;
  const inserted = await query<{ id: string }>(
    `INSERT INTO reports (listing_id, user_id, reporter_key, reason, details)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (listing_id, reporter_key) DO NOTHING RETURNING id::text AS id`,
    [listing.id, user?.id ?? null, key, input.reason, input.details || null],
  );
  // Ya lo había reportado: se responde igual, sin contar dos veces.
  if (!inserted[0]) return { ok: true, repeated: true };

  const [{ open }] = await query<{ open: number }>(
    "SELECT count(*)::int AS open FROM reports WHERE listing_id = $1 AND status = 'abierto'",
    [listing.id],
  );

  let hidden = false;
  if (open >= HIDE_AT) {
    const rows = await query(
      `UPDATE listings SET status = 'pendiente', updated_at = now(),
              review_reason = $2
        WHERE id = $1 AND status = 'publicada' RETURNING id`,
      [listing.id, `Reportado por ${open} personas`],
    );
    hidden = rows.length > 0;
  }

  if (mailConfigured()) {
    const reporter = user ? `${user.name} (${user.email})` : "Visitante sin cuenta";
    await Promise.all([
      ...adminEmails().map((to) =>
        sendReportToAdmin(to, {
          listingTitle: listing.title,
          listingId: listing.id,
          reason: REPORT_REASONS[input.reason],
          details: input.details,
          reporter,
          open,
          hidden,
        }),
      ),
      hidden && listing.owner_email ? sendListingHiddenByReports(listing.owner_email, listing.title) : null,
    ]).catch((error) => console.error("aviso de reporte", error));
  }
  return { ok: true, hidden };
}

/** Reportes para la sala de admin, agrupados por anuncio, los abiertos primero. */
export async function adminReports() {
  return query(
    `SELECT r.id::text AS id, r.listing_id, l.title AS listing_title, l.status AS listing_status,
            r.reason, r.details, r.status, r.created_at,
            COALESCE(u.email, 'Visitante sin cuenta') AS reporter
       FROM reports r
       JOIN listings l ON l.id = r.listing_id
       LEFT JOIN users u ON u.id = r.user_id
      ORDER BY (r.status = 'abierto') DESC, r.created_at DESC
      LIMIT 300`,
  );
}

/**
 * Cierra los reportes de un anuncio. «descartar»: no pasaba nada; si se había
 * ocultado por reportes, vuelve a publicarse. «retirar»: el anuncio queda rechazado.
 */
export async function resolveReports(listingId: string, action: "descartar" | "retirar") {
  await query(
    "UPDATE reports SET status = 'resuelto', resolved_at = now() WHERE listing_id = $1 AND status = 'abierto'",
    [listingId],
  );
  if (action === "retirar") {
    await query("UPDATE listings SET status = 'rechazada', updated_at = now() WHERE id = $1", [listingId]);
  } else {
    await query(
      `UPDATE listings SET status = 'publicada', review_reason = NULL, updated_at = now(),
              published_at = COALESCE(published_at, now())
        WHERE id = $1 AND status = 'pendiente' AND review_reason LIKE 'Reportado por %'`,
      [listingId],
    );
  }
  return { ok: true };
}

export async function openReportsCount() {
  const [row] = await query<{ n: number }>("SELECT count(DISTINCT listing_id)::int AS n FROM reports WHERE status = 'abierto'");
  return row?.n ?? 0;
}
