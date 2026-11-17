import { z } from "zod";
import { PLANS, type PlanId } from "@/lib/plans";
import { startPayment } from "@/server/payments";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

const plans = PLANS.map((p) => p.id) as [PlanId, ...PlanId[]];

/** Inicia el pago para destacar un anuncio propio. Devuelve la URL de Wompi. */
export const POST = endpoint({
  scope: "pagos",
  max: 10,
  need: "verified",
  schema: z.object({ listingId: z.string().min(1).max(60), plan: z.enum(plans) }),
  run: async ({ user, input }) => startPayment(user!, input.listingId, input.plan),
});
