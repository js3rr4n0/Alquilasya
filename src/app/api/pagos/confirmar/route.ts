import { NextResponse } from "next/server";
import { z } from "zod";
import { ownPayment } from "@/server/payments";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

/** Al volver de Wompi: revisa la orden con Wompi y dice cómo quedó. Solo su dueño. */
export const POST = endpoint({
  scope: "pagos-confirmar",
  max: 30,
  need: "user",
  schema: z.object({ id: z.string().regex(/^pg_[A-Za-z0-9_-]{6,30}$/) }),
  run: async ({ user, input }) => {
    const order = await ownPayment(input.id, user!.id);
    if (!order) return NextResponse.json({ error: "No encontramos ese pago." }, { status: 404 });
    return { order: { ...order, userId: undefined } };
  },
});
