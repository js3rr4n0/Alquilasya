import { createHmac } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Freno simple por IP. Se reinicia con cada arranque en frío, pero corta ráfagas. */
const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimited(request: Request, scope: string, max: number, windowMs = 60_000) {
  const ip = (request.headers.get("x-forwarded-for") ?? "anon").split(",")[0].trim();
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) for (const [k, b] of buckets) if (now > b.reset) buckets.delete(k);
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}

/**
 * Huella de la IP de quien pide (HMAC): sirve para límites guardados en la base sin
 * guardar la IP. En Vercel, el primer valor de x-forwarded-for lo pone Vercel.
 */
export function ipFingerprint(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "desconocida";
  const secret = process.env.ANALYTICS_SECRET || `${process.env.DATABASE_URL ?? ""}:limites`;
  return createHmac("sha256", secret).update(ip).digest("base64url").slice(0, 22);
}

export const tooMany = () =>
  NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
    { status: 429 },
  );

export const invalid = (error: ZodError) =>
  NextResponse.json({ error: error.issues.map((i) => i.message).join(". ") }, { status: 400 });

export const noDatabase = () =>
  NextResponse.json(
    { error: "La base de datos aún no está conectada. Intenta más tarde." },
    { status: 503 },
  );

/** Tras publicar, pausar o borrar: las páginas por zona y el sitemap se regeneran. */
export function refreshPublicPages() {
  revalidatePath("/");
  revalidatePath("/alquiler/[zona]", "page");
  revalidatePath("/sitemap.xml");
}
