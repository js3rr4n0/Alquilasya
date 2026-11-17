import { z } from "zod";
import { query } from "@/lib/db";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

/**
 * Anuncios guardados de la cuenta. El navegador también los guarda; al entrar,
 * los dos lados se juntan para que lo guardado en el teléfono aparezca en la
 * computadora y al revés.
 */

const id = z.string().min(1).max(120);

async function list(userId: string) {
  const rows = await query<{ listing_id: string }>(
    "SELECT listing_id FROM saved_listings WHERE user_id = $1 ORDER BY created_at DESC LIMIT 500",
    [userId],
  );
  return rows.map((r) => r.listing_id);
}

export const GET = endpoint({
  scope: "guardadas",
  max: 60,
  need: "user",
  run: async ({ user }) => ({ ids: await list(user!.id) }),
});

/** `add` y `remove` cambian la lista; `merge` suma lo que traía el navegador. Devuelve la lista final. */
export const POST = endpoint({
  scope: "guardadas-cambio",
  max: 120,
  need: "user",
  schema: z.object({
    add: z.array(id).max(200).optional(),
    remove: z.array(id).max(200).optional(),
  }),
  run: async ({ user, input }) => {
    if (input.add?.length) {
      // Solo anuncios que existen; los borrados se ignoran.
      await query(
        `INSERT INTO saved_listings (user_id, listing_id)
         SELECT $1, l.id FROM listings l WHERE l.id = ANY($2::text[])
         ON CONFLICT DO NOTHING`,
        [user!.id, input.add],
      );
    }
    if (input.remove?.length) {
      await query("DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = ANY($2::text[])", [
        user!.id,
        input.remove,
      ]);
    }
    return { ids: await list(user!.id) };
  },
});
