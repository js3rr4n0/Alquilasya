import { z } from "zod";
import { query } from "@/lib/db";
import { AuthError, type User } from "./auth";
import { mailConfigured, sendNewMessageNotice } from "./mail";
import { allow } from "./throttle";

/**
 * Chat privado entre quien busca y quien publica. Una conversación por anuncio
 * y persona interesada. Los mensajes solo los leen sus dos participantes: cada
 * consulta filtra por el id de quien pregunta.
 */
const body = z.string().trim().min(1, "Escribe un mensaje").max(2000, "El mensaje es muy largo");

export const startInput = z.object({ listingId: z.string().min(1).max(120), body });
export const sendInput = z.object({ body });

const MESSAGES_PER_10_MIN = 40;

async function guard(user: User) {
  if (!(await allow(`chat:${user.id}`, MESSAGES_PER_10_MIN, 10))) {
    throw new AuthError("Estás enviando mensajes muy rápido. Espera unos minutos.", 429);
  }
}

/** Primer mensaje sobre un anuncio (o uno más, si la conversación ya existía). */
export async function startConversation(user: User, input: z.infer<typeof startInput>) {
  const listings = await query<{ user_id: string | null; title: string; status: string }>(
    "SELECT user_id::text AS user_id, title, status FROM listings WHERE id = $1",
    [input.listingId],
  );
  const listing = listings[0];
  if (!listing || listing.status !== "publicada" || !listing.user_id) {
    throw new AuthError("Este anuncio ya no está disponible.", 404);
  }
  if (listing.user_id === user.id) throw new AuthError("Este anuncio es tuyo.");
  await guard(user);

  const created = await query<{ id: string; fresh: boolean }>(
    `INSERT INTO conversations (listing_id, renter_id, owner_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (listing_id, renter_id) DO UPDATE SET last_message_at = now()
     RETURNING id::text AS id, (xmax = 0) AS fresh`,
    [input.listingId, user.id, listing.user_id],
  );
  const conversation = created[0];
  await insertMessage(conversation.id, user.id, input.body, "renter");

  // Aviso por correo solo al abrir la conversación, para no llenar la bandeja.
  if (conversation.fresh && mailConfigured()) {
    const owners = await query<{ email: string }>("SELECT email FROM users WHERE id = $1", [
      listing.user_id,
    ]);
    if (owners[0]) {
      await sendNewMessageNotice(owners[0].email, user.name.split(" ")[0], listing.title).catch(
        (error) => console.error("aviso de mensaje", error),
      );
    }
  }
  return { id: conversation.id };
}

async function insertMessage(
  conversationId: string,
  senderId: string,
  text: string,
  side: "renter" | "owner",
) {
  await query("INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)", [
    conversationId,
    senderId,
    text,
  ]);
  await query(
    side === "renter"
      ? "UPDATE conversations SET last_message_at = now(), renter_read_at = now() WHERE id = $1"
      : "UPDATE conversations SET last_message_at = now(), owner_read_at = now() WHERE id = $1",
    [conversationId],
  );
}

type Membership = { id: string; side: "renter" | "owner" };

/** La conversación, solo si quien pregunta participa en ella. */
async function membership(userId: string, conversationId: string): Promise<Membership> {
  if (!/^\d{1,18}$/.test(conversationId)) throw new AuthError("Conversación no encontrada.", 404);
  const rows = await query<{ id: string; renter_id: string; owner_id: string }>(
    `SELECT id::text AS id, renter_id::text AS renter_id, owner_id::text AS owner_id
       FROM conversations WHERE id = $1 AND (renter_id = $2 OR owner_id = $2)`,
    [conversationId, userId],
  );
  const row = rows[0];
  if (!row) throw new AuthError("Conversación no encontrada.", 404);
  return { id: row.id, side: row.renter_id === userId ? "renter" : "owner" };
}

export async function sendMessage(user: User, conversationId: string, text: string) {
  const member = await membership(user.id, conversationId);
  await guard(user);
  await insertMessage(member.id, user.id, text, member.side);
}

/** Mis conversaciones, con el último mensaje y cuántos tengo sin leer. */
export async function listConversations(userId: string) {
  return query(
    `SELECT c.id::text AS id, c.listing_id, l.title AS listing_title, l.zone, l.region,
            l.data->>'cover' AS cover, l.price_month,
            (c.owner_id = $1) AS i_am_owner,
            other.name AS other_name,
            c.last_message_at,
            last.body AS last_body,
            (last.sender_id = $1) AS last_mine,
            (SELECT count(*)::int FROM messages m
              WHERE m.conversation_id = c.id AND m.sender_id <> $1
                AND m.created_at > CASE WHEN c.owner_id = $1 THEN c.owner_read_at ELSE c.renter_read_at END
            ) AS unread
       FROM conversations c
       JOIN listings l ON l.id = c.listing_id
       JOIN users other ON other.id = CASE WHEN c.owner_id = $1 THEN c.renter_id ELSE c.owner_id END
       LEFT JOIN LATERAL (
         SELECT body, sender_id FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1
       ) last ON true
      WHERE c.renter_id = $1 OR c.owner_id = $1
      ORDER BY c.last_message_at DESC
      LIMIT 100`,
    [userId],
  );
}

export async function unreadCount(userId: string) {
  const rows = await query<{ n: number }>(
    `SELECT count(*)::int AS n
       FROM messages m JOIN conversations c ON c.id = m.conversation_id
      WHERE (c.renter_id = $1 OR c.owner_id = $1) AND m.sender_id <> $1
        AND m.created_at > CASE WHEN c.owner_id = $1 THEN c.owner_read_at ELSE c.renter_read_at END`,
    [userId],
  );
  return rows[0]?.n ?? 0;
}

/** Mensajes de una conversación (opcionalmente solo los posteriores a `after`) y la marca leída. */
export async function readConversation(user: User, conversationId: string, after = "0") {
  const member = await membership(user.id, conversationId);
  const since = /^\d{1,18}$/.test(after) ? after : "0";
  const messages = await query(
    `SELECT id::text AS id, (sender_id = $2) AS mine, body, created_at
       FROM messages WHERE conversation_id = $1 AND id > $3
      ORDER BY id ASC LIMIT 500`,
    [member.id, user.id, since],
  );
  await query(
    member.side === "renter"
      ? "UPDATE conversations SET renter_read_at = now() WHERE id = $1"
      : "UPDATE conversations SET owner_read_at = now() WHERE id = $1",
    [member.id],
  );
  return { messages };
}
