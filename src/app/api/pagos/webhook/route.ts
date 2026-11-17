import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { rateLimited } from "@/server/http";
import { confirmPayment, findPaymentForWebhook } from "@/server/payments";
import { signatureMatches, wompiConfigured } from "@/server/wompi";

export const dynamic = "force-dynamic";

/**
 * Aviso de Wompi tras un pago exitoso. El aviso solo dice «revisa esta orden»:
 * la activación depende de lo que responda el API de Wompi, no del contenido
 * recibido, así que un aviso falso no puede destacar nada.
 */
export async function POST(request: Request) {
  if (!hasDatabase() || !wompiConfigured() || rateLimited(request, "wompi-webhook", 60)) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  const raw = await request.text();
  const signed = signatureMatches(raw, request.headers.get("wompi_hash") ?? request.headers.get("wompi-hash"));

  let body: { EnlacePago?: { Id?: number; IdentificadorEnlaceComercio?: string } } = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ref = body.EnlacePago?.IdentificadorEnlaceComercio;
  const linkId = Number(body.EnlacePago?.Id) || undefined;
  const id = await findPaymentForWebhook(typeof ref === "string" ? ref.slice(0, 60) : undefined, linkId);
  if (!id) {
    console.warn("Webhook Wompi sin orden", { ref, linkId, signed });
    return NextResponse.json({ ok: true });
  }
  try {
    const order = await confirmPayment(id);
    if (!signed) console.warn("Webhook Wompi sin firma válida; se confirmó consultando el API", id);
    return NextResponse.json({ ok: true, status: order?.status });
  } catch (error) {
    console.error("Webhook Wompi", error);
    // 500 para que Wompi reintente más tarde.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
