import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, query } from "@/lib/db";
import { currentUser } from "@/server/auth";
import { rateLimited } from "@/server/http";
import { isBot, parseUserAgent } from "@/server/ua";

/**
 * Recibe los eventos de analítica del navegador (vía sendBeacon).
 * Responde siempre 204: medir nunca debe romper ni frenar la página.
 */

const text = (max: number) => z.string().max(max).optional();

const EVENT = z.object({
  name: z.string().regex(/^[a-z_]{2,40}$/),
  vid: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/),
  sid: z.string().regex(/^[A-Za-z0-9_-]{8,40}$/),
  path: text(300),
  ref: text(300),
  utm_source: text(100),
  utm_medium: text(100),
  utm_campaign: text(150),
  screen: z.string().regex(/^\d{2,5}x\d{2,5}$/).optional(),
  lang: text(20),
  dur: z.number().int().min(0).max(6 * 60 * 60 * 1000).optional(),
  props: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
});

const empty = () => new NextResponse(null, { status: 204 });

/** Huella de la IP: sirve para contar visitantes únicos, no para recuperar la IP. */
function ipHash(ip: string) {
  const secret = process.env.ANALYTICS_SECRET || `${process.env.DATABASE_URL ?? ""}:analitica`;
  return createHmac("sha256", secret).update(ip).digest("base64url").slice(0, 22);
}

function refHost(ref: string | undefined, host: string | null) {
  if (!ref) return null;
  try {
    const h = new URL(ref).hostname.replace(/^www\./, "");
    // Navegar dentro del propio sitio no es una fuente.
    return host && h === host.replace(/^www\./, "") ? null : h;
  } catch {
    return null;
  }
}

const header = (r: Request, name: string) => {
  const v = r.headers.get(name);
  if (!v) return null;
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

export async function POST(request: Request) {
  if (!hasDatabase() || rateLimited(request, "analitica", 120)) return empty();
  // Quien pide no ser seguido, no se cuenta.
  if (request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return empty();
  const ua = request.headers.get("user-agent") ?? "";
  if (isBot(ua)) return empty();

  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return empty();
  }
  const parsed = EVENT.safeParse(body);
  if (!parsed.success) return empty();
  const e = parsed.data;

  try {
    const user = await currentUser().catch(() => null);
    const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const { device, os, browser } = parseUserAgent(ua);
    const num = (v: string | null) => (v && Number.isFinite(Number(v)) ? Number(v) : null);

    await query(
      `INSERT INTO analytics_events
         (name, visitor_id, session_id, user_id, path, referrer_host, utm_source, utm_medium, utm_campaign,
          country, region, city, lat, lng, timezone, device, os, browser, screen, lang, ip_hash, duration_ms, props)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)`,
      [
        e.name,
        e.vid,
        e.sid,
        user?.id ?? null,
        e.path ?? null,
        refHost(e.ref, request.headers.get("host")),
        e.utm_source ?? null,
        e.utm_medium ?? null,
        e.utm_campaign ?? null,
        header(request, "x-vercel-ip-country"),
        header(request, "x-vercel-ip-country-region"),
        header(request, "x-vercel-ip-city"),
        num(request.headers.get("x-vercel-ip-latitude")),
        num(request.headers.get("x-vercel-ip-longitude")),
        header(request, "x-vercel-ip-timezone"),
        device,
        os,
        browser,
        e.screen ?? null,
        e.lang ?? null,
        ip ? ipHash(ip) : null,
        e.dur ?? null,
        e.props ? JSON.stringify(e.props) : null,
      ],
    );
    // Limpieza ocasional: se conserva poco más de un año.
    if (Math.random() < 0.002) {
      await query("DELETE FROM analytics_events WHERE at < now() - interval '400 days'").catch(() => {});
    }
  } catch (error) {
    console.error("POST /api/t", error);
  }
  return empty();
}
