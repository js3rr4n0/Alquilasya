import { z } from "zod";
import { blobConfigured } from "@/server/blob";
import { refreshPublicPages } from "@/server/http";
import { adminOverview, setFeatured, setListingStatus } from "@/server/listings";
import { mailConfigured } from "@/server/mail";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

/** Sala de administración: solo cuentas verificadas cuyo correo está en ADMIN_EMAILS. */
export const GET = endpoint({
  scope: "admin",
  max: 120,
  need: "admin",
  run: async () => ({
    ...(await adminOverview()),
    services: {
      correo: mailConfigured(),
      fotos: blobConfigured(),
    },
  }),
});

export const POST = endpoint({
  scope: "admin-action",
  max: 60,
  need: "admin",
  schema: z.union([
    z.object({
      id: z.string().min(1).max(120),
      status: z.enum(["pendiente", "publicada", "rechazada", "pausada"]),
    }),
    // Destacar a mano: 7 o 30 días, o 0 para quitarlo.
    z.object({ id: z.string().min(1).max(120), destacar: z.union([z.literal(0), z.literal(7), z.literal(30)]) }),
  ]),
  run: async ({ input }) => {
    const ok =
      "status" in input ? await setListingStatus(input.id, input.status) : await setFeatured(input.id, input.destacar);
    if (ok) refreshPublicPages();
    return { ok };
  },
});
