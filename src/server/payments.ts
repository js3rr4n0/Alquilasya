import { randomBytes } from "node:crypto";
import { query } from "@/lib/db";
import { planById, type PlanId } from "@/lib/plans";
import { abs } from "@/lib/site";
import { AuthError } from "./auth";
import { refreshPublicPages } from "./http";
import { createPaymentLink, linkStatus, wompiConfigured } from "./wompi";

/**
 * Pagos para destacar anuncios.
 *
 * Regla de seguridad: nada de lo que llega del navegador ni del webhook marca un
 * pago como hecho. Ambos solo piden revisar la orden, y la revisión consulta a
 * Wompi el enlace que creamos nosotros (monto fijo, un solo pago exitoso).
 */

export type PaymentStatus = "pendiente" | "pagada" | "fallida" | "vencida";

type PaymentRow = {
  id: string;
  listing_id: string | null;
  user_id: string | null;
  listing_title: string;
  plan: PlanId;
  days: number;
  amount: string;
  status: PaymentStatus;
  wompi_link_id: string | null;
  wompi_url: string | null;
  created_at: string;
  paid_at: string | null;
};

/** Un enlace sirve 24 horas; si la persona vuelve antes, se reutiliza. */
const LINK_HOURS = 24;

const acceptTestPayments = () => process.env.WOMPI_ACEPTAR_PRUEBAS === "1";

/** Crea (o reutiliza) la orden y su enlace de pago. Devuelve la URL de Wompi. */
export async function startPayment(user: { id: string; email: string }, listingId: string, planId: PlanId) {
  if (!wompiConfigured()) throw new AuthError("Los pagos aún no están activados.", 503);
  const plan = planById(planId);
  if (!plan) throw new AuthError("Ese plan no existe.", 400);

  const [listing] = await query<{ id: string; title: string; status: string }>(
    "SELECT id, title, status FROM listings WHERE id = $1 AND user_id = $2",
    [listingId, user.id],
  );
  if (!listing) throw new AuthError("No encontramos ese anuncio en tu cuenta.", 404);
  // Pagar publica al instante: no hace falta esperar la revisión.
  if (listing.status !== "publicada" && listing.status !== "pendiente") {
    throw new AuthError("Este anuncio no se puede destacar ahora. Reactívalo o escríbenos.", 409);
  }

  const [open] = await query<PaymentRow>(
    `SELECT * FROM payments
      WHERE listing_id = $1 AND user_id = $2 AND plan = $3 AND status = 'pendiente'
        AND wompi_url IS NOT NULL AND created_at > now() - make_interval(hours => $4)
      ORDER BY created_at DESC LIMIT 1`,
    [listingId, user.id, plan.id, LINK_HOURS - 1],
  );
  if (open?.wompi_url) return { id: open.id, url: open.wompi_url };

  const id = `pg_${randomBytes(9).toString("base64url")}`;
  await query(
    `INSERT INTO payments (id, listing_id, user_id, listing_title, user_email, plan, days, amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, listing.id, user.id, listing.title, user.email, plan.id, plan.days, plan.price],
  );

  try {
    const link = await createPaymentLink({
      reference: id,
      amount: plan.price,
      product: `${plan.name} · AlquilasYa`,
      description: `Anuncio: ${listing.title}. Aparece primero en las búsquedas durante ${plan.days} días. Publicar sigue siendo gratis.`,
      redirectUrl: abs(`/pago?orden=${id}`),
      returnUrl: abs("/cuenta"),
      webhookUrl: abs("/api/pagos/webhook"),
      notifyEmails: process.env.WOMPI_AVISOS ?? undefined,
      expiresAt: new Date(Date.now() + LINK_HOURS * 3600_000),
    });
    await query("UPDATE payments SET wompi_link_id = $2, wompi_url = $3, live = $4 WHERE id = $1", [
      id,
      link.idEnlace,
      link.urlEnlace,
      link.estaProductivo,
    ]);
    return { id, url: link.urlEnlace };
  } catch (error) {
    await query("UPDATE payments SET status = 'fallida' WHERE id = $1", [id]).catch(() => {});
    console.error("Wompi crear enlace", error);
    throw new AuthError("No pudimos abrir la página de pago. Intenta de nuevo en un momento.", 502);
  }
}

/**
 * Revisa con Wompi si la orden ya se pagó y, si es así, destaca el anuncio.
 * Se puede llamar las veces que sea: solo activa una vez.
 */
export async function confirmPayment(id: string) {
  const [order] = await query<PaymentRow>("SELECT * FROM payments WHERE id = $1", [id]);
  if (!order) return null;
  if (order.status !== "pendiente" || !order.wompi_link_id) return summary(order);

  const { approved } = await linkStatus(Number(order.wompi_link_id));
  const amountOk = approved && Number(approved.monto) + 0.001 >= Number(order.amount);
  const realOk = approved && (approved.esReal || acceptTestPayments());

  if (approved && amountOk && realOk) {
    // Orden y anuncio en una sola sentencia: si dos avisos llegan a la vez, solo uno activa.
    // Si ya estaba destacado, los días se suman al final del periodo vigente.
    const activated = await query(
      `WITH p AS (
         UPDATE payments SET status = 'pagada', paid_at = now(), wompi_tx_id = $2, live = $3
          WHERE id = $1 AND status = 'pendiente'
          RETURNING listing_id, days)
       UPDATE listings l
          SET featured_until = GREATEST(COALESCE(l.featured_until, now()), now()) + make_interval(days => p.days),
              status = CASE WHEN l.status = 'pendiente' THEN 'publicada' ELSE l.status END,
              published_at = CASE WHEN l.status = 'pendiente' THEN COALESCE(l.published_at, now()) ELSE l.published_at END,
              updated_at = now()
         FROM p WHERE l.id = p.listing_id
       RETURNING l.id`,
      [order.id, approved.idTransaccion, approved.esReal],
    );
    if (activated.length) refreshPublicPages();
  } else if (approved) {
    console.error("Pago Wompi no válido para la orden", order.id, { monto: approved.monto, esReal: approved.esReal });
  } else if (Date.now() - new Date(order.created_at).getTime() > LINK_HOURS * 3600_000) {
    await query("UPDATE payments SET status = 'vencida' WHERE id = $1 AND status = 'pendiente'", [order.id]);
  }

  const [fresh] = await query<PaymentRow>("SELECT * FROM payments WHERE id = $1", [id]);
  return summary(fresh);
}

/** Lo que el navegador del dueño puede ver de su orden. */
async function summary(order: PaymentRow) {
  const [listing] = order.listing_id
    ? await query<{ featured_until: string | null }>("SELECT featured_until FROM listings WHERE id = $1", [order.listing_id])
    : [];
  return {
    id: order.id,
    status: order.status,
    plan: order.plan,
    days: order.days,
    amount: Number(order.amount),
    listingId: order.listing_id,
    listingTitle: order.listing_title,
    featuredUntil: listing?.featured_until ?? null,
    userId: order.user_id,
  };
}

export async function ownPayment(id: string, userId: string) {
  const [order] = await query<{ user_id: string }>("SELECT user_id::text FROM payments WHERE id = $1", [id]);
  if (!order || order.user_id !== userId) return null;
  return confirmPayment(id);
}

/** Órdenes que un aviso de Wompi puede estar confirmando. */
export async function findPaymentForWebhook(reference: string | undefined, linkId: number | undefined) {
  const rows = await query<{ id: string }>(
    `SELECT id FROM payments WHERE (id = $1 OR wompi_link_id = $2) ORDER BY created_at DESC LIMIT 1`,
    [reference ?? "", linkId ?? -1],
  );
  return rows[0]?.id ?? null;
}

export async function adminPayments() {
  const [rows, totals] = await Promise.all([
    query(
      `SELECT id, listing_id, listing_title, user_email, plan, days, amount, status, live, created_at, paid_at
         FROM payments ORDER BY created_at DESC LIMIT 200`,
    ),
    query<{ paid: number; revenue: string; month: string; featured: number }>(
      `SELECT count(*) FILTER (WHERE status = 'pagada' AND live)::int AS paid,
              COALESCE(sum(amount) FILTER (WHERE status = 'pagada' AND live), 0) AS revenue,
              COALESCE(sum(amount) FILTER (WHERE status = 'pagada' AND live AND paid_at > date_trunc('month', now())), 0) AS month,
              (SELECT count(*)::int FROM listings WHERE featured_until > now()) AS featured
         FROM payments`,
    ),
  ]);
  return { payments: rows, totals: totals[0], enabled: wompiConfigured() };
}
