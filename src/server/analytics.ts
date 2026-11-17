import { query } from "@/lib/db";

/**
 * Resumen de la analítica propia para la sala de admin. Todo se calcula en la
 * base para el periodo pedido; las visitas de las cuentas admin no cuentan.
 */

export const RANGES = { "1": 1, "7": 7, "30": 30, "90": 90 } as const;
export type Range = keyof typeof RANGES;

const TZ = "America/El_Salvador";

/** Agrupa dominios de origen en nombres que se entienden. */
function sourceName(host: string | null, utm: string | null) {
  if (utm) return utm.toLowerCase().includes("whatsapp") ? "WhatsApp" : `Campaña: ${utm}`;
  if (!host) return "Directo (escribió la dirección o un enlace guardado)";
  const h = host.toLowerCase();
  if (/(^|\.)google\./.test(h)) return "Google";
  if (/bing\.|duckduckgo|yahoo|ecosia|brave/.test(h)) return "Otros buscadores";
  if (/facebook|fb\.|messenger/.test(h)) return "Facebook";
  if (/instagram/.test(h)) return "Instagram";
  if (/whatsapp|wa\.me/.test(h)) return "WhatsApp";
  if (/t\.co$|twitter|x\.com/.test(h)) return "X (Twitter)";
  if (/tiktok/.test(h)) return "TikTok";
  if (/linkedin|lnkd/.test(h)) return "LinkedIn";
  if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(h)) return "Asistentes de IA";
  return h;
}

type Row = Record<string, unknown>;
const n = (v: unknown) => Number(v ?? 0);

export async function analyticsOverview(range: Range, adminEmails: string[]) {
  const days = RANGES[range];
  // Filtro común: periodo y sin cuentas admin. $1 = días, $2 = correos admin.
  const where = `at > now() - make_interval(days => $1)
    AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM users WHERE email = ANY($2::text[])))
    AND visitor_id NOT IN (
      SELECT DISTINCT visitor_id FROM analytics_events a2
       WHERE a2.user_id IN (SELECT id FROM users WHERE email = ANY($2::text[])))`;
  const p = [days, adminEmails];
  const bucket = days === 1 ? "hour" : "day";

  const [
    totals,
    previous,
    live,
    series,
    pages,
    sources,
    places,
    devices,
    oses,
    browsers,
    hours,
    searchZones,
    searchDurations,
    funnel,
    listings,
    loyalty,
    recent,
  ] = await Promise.all([
    query(
      `WITH e AS (SELECT * FROM analytics_events WHERE ${where}),
            s AS (SELECT session_id, count(*) FILTER (WHERE name = 'pagina') AS pv,
                         sum(duration_ms) FILTER (WHERE name = 'tiempo') AS ms
                    FROM e GROUP BY session_id)
       SELECT (SELECT count(*) FROM e WHERE name = 'pagina') AS pageviews,
              (SELECT count(DISTINCT visitor_id) FROM e) AS visitors,
              (SELECT count(*) FROM s) AS sessions,
              (SELECT round(avg(ms)) FROM s WHERE ms IS NOT NULL) AS avg_session_ms,
              (SELECT round(100.0 * count(*) FILTER (WHERE pv <= 1) / NULLIF(count(*), 0)) FROM s) AS bounce_pct`,
      p,
    ),
    query(
      `SELECT count(DISTINCT visitor_id) AS visitors, count(*) FILTER (WHERE name = 'pagina') AS pageviews
         FROM analytics_events
        WHERE at <= now() - make_interval(days => $1) AND at > now() - make_interval(days => $1 * 2)
          AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM users WHERE email = ANY($2::text[])))`,
      p,
    ),
    query(
      `SELECT count(DISTINCT visitor_id) AS now FROM analytics_events
        WHERE at > now() - interval '5 minutes'
          AND (user_id IS NULL OR user_id NOT IN (SELECT id FROM users WHERE email = ANY($1::text[])))`,
      [adminEmails],
    ),
    query(
      `WITH b AS (
         SELECT generate_series(date_trunc('${bucket}', (now() - make_interval(days => $1)) AT TIME ZONE '${TZ}'),
                                date_trunc('${bucket}', now() AT TIME ZONE '${TZ}'), interval '1 ${bucket}') AS t)
       SELECT to_char(b.t, 'YYYY-MM-DD"T"HH24:MI') AS t,
              count(DISTINCT e.visitor_id) AS visitors,
              count(e.id) FILTER (WHERE e.name = 'pagina') AS pageviews
         FROM b LEFT JOIN (SELECT * FROM analytics_events WHERE ${where}) e
           ON date_trunc('${bucket}', e.at AT TIME ZONE '${TZ}') = b.t
        GROUP BY b.t ORDER BY b.t`,
      p,
    ),
    query(
      `SELECT COALESCE(props->>'pagina', path) AS path,
              count(*) FILTER (WHERE name = 'pagina') AS views,
              count(DISTINCT visitor_id) FILTER (WHERE name = 'pagina') AS visitors,
              round(avg(duration_ms) FILTER (WHERE name = 'tiempo')) AS avg_ms
         FROM analytics_events WHERE ${where} AND name IN ('pagina', 'tiempo')
        GROUP BY 1 HAVING count(*) FILTER (WHERE name = 'pagina') > 0
        ORDER BY views DESC LIMIT 15`,
      p,
    ),
    // La fuente de una sesión es la de su primera página.
    query(
      `SELECT referrer_host, utm_source, count(*) AS sessions FROM (
         SELECT DISTINCT ON (session_id) referrer_host, utm_source
           FROM analytics_events WHERE ${where} AND name = 'pagina'
          ORDER BY session_id, at) f
        GROUP BY 1, 2`,
      p,
    ),
    query(
      `SELECT country, region, city, count(DISTINCT visitor_id) AS visitors
         FROM analytics_events WHERE ${where}
        GROUP BY 1, 2, 3 ORDER BY visitors DESC LIMIT 20`,
      p,
    ),
    query(`SELECT device AS label, count(DISTINCT visitor_id) AS n FROM analytics_events WHERE ${where} GROUP BY 1 ORDER BY n DESC`, p),
    query(`SELECT os AS label, count(DISTINCT visitor_id) AS n FROM analytics_events WHERE ${where} GROUP BY 1 ORDER BY n DESC`, p),
    query(`SELECT browser AS label, count(DISTINCT visitor_id) AS n FROM analytics_events WHERE ${where} GROUP BY 1 ORDER BY n DESC LIMIT 8`, p),
    query(
      `SELECT extract(hour FROM at AT TIME ZONE '${TZ}')::int AS h, count(*) AS n
         FROM analytics_events WHERE ${where} AND name = 'pagina' GROUP BY 1 ORDER BY 1`,
      p,
    ),
    query(
      `SELECT props->>'zona' AS label, count(*) AS n, round(avg((props->>'resultados')::numeric)) AS avg_results
         FROM analytics_events WHERE ${where} AND name = 'busqueda' GROUP BY 1 ORDER BY n DESC LIMIT 12`,
      p,
    ),
    query(
      `SELECT props->>'plazo' AS label, count(*) AS n FROM analytics_events
        WHERE ${where} AND name = 'busqueda' GROUP BY 1 ORDER BY n DESC`,
      p,
    ),
    query(
      `SELECT name, count(DISTINCT visitor_id) AS visitors, count(*) AS events
         FROM analytics_events WHERE ${where}
          AND name IN ('pagina','busqueda','ficha_vista','contacto_abierto','mensaje_enviado','cuenta_creada','correo_verificado','anuncio_enviado')
        GROUP BY 1`,
      p,
    ),
    query(
      `SELECT e.props->>'anuncio' AS id, l.title, l.zone, count(*) AS views, count(DISTINCT e.visitor_id) AS visitors
         FROM (SELECT * FROM analytics_events WHERE ${where} AND name = 'ficha_vista') e
         LEFT JOIN listings l ON l.id = e.props->>'anuncio'
        GROUP BY 1, 2, 3 ORDER BY views DESC LIMIT 10`,
      p,
    ),
    // Nuevos: su primera visita cae dentro del periodo.
    query(
      `WITH v AS (SELECT DISTINCT visitor_id FROM analytics_events WHERE ${where}),
            f AS (SELECT visitor_id, min(at) AS first FROM analytics_events
                   WHERE visitor_id IN (SELECT visitor_id FROM v) GROUP BY 1)
       SELECT count(*) FILTER (WHERE first > now() - make_interval(days => $1)) AS new,
              count(*) FILTER (WHERE first <= now() - make_interval(days => $1)) AS returning
         FROM f`,
      p,
    ),
    query(
      `SELECT at, name, path, city, region, country, device, os, browser, referrer_host, utm_source, props
         FROM analytics_events WHERE ${where} AND name <> 'tiempo'
        ORDER BY at DESC LIMIT 60`,
      p,
    ),
  ]);

  const t = totals[0] ?? {};
  const prev = previous[0] ?? {};

  const bySource = new Map<string, number>();
  for (const r of sources as Row[]) {
    const k = sourceName(r.referrer_host as string | null, r.utm_source as string | null);
    bySource.set(k, (bySource.get(k) ?? 0) + n(r.sessions));
  }

  const f = Object.fromEntries((funnel as Row[]).map((r) => [r.name as string, n(r.visitors)]));
  const loyal = loyalty[0] ?? {};

  return {
    range,
    totals: {
      visitors: n(t.visitors),
      pageviews: n(t.pageviews),
      sessions: n(t.sessions),
      avgSessionMs: n(t.avg_session_ms),
      bouncePct: n(t.bounce_pct),
      liveNow: n(live[0]?.now),
      newVisitors: n(loyal.new),
      returningVisitors: n(loyal.returning),
      previousVisitors: n(prev.visitors),
      previousPageviews: n(prev.pageviews),
    },
    series: (series as Row[]).map((r) => ({ t: r.t as string, visitors: n(r.visitors), pageviews: n(r.pageviews) })),
    bucket,
    pages: (pages as Row[]).map((r) => ({ label: r.path as string, n: n(r.views), visitors: n(r.visitors), avgMs: n(r.avg_ms) })),
    sources: [...bySource].map(([label, v]) => ({ label, n: v })).sort((a, b) => b.n - a.n).slice(0, 12),
    places: (places as Row[]).map((r) => ({
      country: (r.country as string) ?? null,
      region: (r.region as string) ?? null,
      city: (r.city as string) ?? null,
      n: n(r.visitors),
    })),
    devices: (devices as Row[]).map((r) => ({ label: r.label as string, n: n(r.n) })),
    oses: (oses as Row[]).map((r) => ({ label: r.label as string, n: n(r.n) })),
    browsers: (browsers as Row[]).map((r) => ({ label: r.label as string, n: n(r.n) })),
    hours: Array.from({ length: 24 }, (_, h) => ({ h, n: n((hours as Row[]).find((r) => n(r.h) === h)?.n) })),
    searchZones: (searchZones as Row[]).map((r) => ({ label: r.label as string, n: n(r.n), avgResults: n(r.avg_results) })),
    searchDurations: (searchDurations as Row[]).map((r) => ({ label: r.label as string, n: n(r.n) })),
    funnel: [
      { label: "Visitaron el sitio", n: f.pagina ?? 0 },
      { label: "Buscaron", n: f.busqueda ?? 0 },
      { label: "Abrieron una ficha", n: f.ficha_vista ?? 0 },
      { label: "Quisieron escribir", n: f.contacto_abierto ?? 0 },
      { label: "Enviaron un mensaje", n: f.mensaje_enviado ?? 0 },
    ],
    actions: [
      { label: "Cuentas creadas", n: f.cuenta_creada ?? 0 },
      { label: "Correos confirmados", n: f.correo_verificado ?? 0 },
      { label: "Anuncios enviados", n: f.anuncio_enviado ?? 0 },
    ],
    listings: (listings as Row[]).map((r) => ({
      id: r.id as string,
      label: (r.title as string) ?? `${r.id} (borrado)`,
      zone: (r.zone as string) ?? "",
      n: n(r.views),
      visitors: n(r.visitors),
    })),
    recent: (recent as Row[]).map((r) => ({
      at: r.at as string,
      name: r.name as string,
      path: r.path as string,
      place: [r.city, r.region, r.country].filter(Boolean).join(", "),
      device: `${r.device ?? ""} · ${r.os ?? ""} · ${r.browser ?? ""}`,
      // Solo se nombra la fuente cuando la hay; navegar dentro del sitio no tiene.
      source: r.referrer_host || r.utm_source ? sourceName(r.referrer_host as string | null, r.utm_source as string | null) : "",
      props: r.props as Record<string, unknown> | null,
    })),
  };
}

export type AnalyticsOverview = Awaited<ReturnType<typeof analyticsOverview>>;
