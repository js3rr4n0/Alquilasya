import { timingSafeEqual } from "node:crypto";
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

export function isAdmin(request: Request) {
  const expected = process.env.ADMIN_TOKEN ?? "";
  const given = request.headers.get("x-admin-token") ?? "";
  if (expected.length < 12 || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Tras publicar, pausar o borrar: las páginas por zona y el sitemap se regeneran. */
export function refreshPublicPages() {
  revalidatePath("/alquiler/[zona]", "page");
  revalidatePath("/sitemap.xml");
}
