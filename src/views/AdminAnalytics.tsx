"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Segmented } from "../components/ui";
import type { AnalyticsOverview } from "../server/analytics";
import { cx } from "../lib/format";

/**
 * Pestaña «Visitas» de la sala de admin: quién entra, de dónde, con qué y qué hace.
 * Una sola serie por gráfica, en el color de marca; los valores siempre visibles
 * en texto, y la tabla de la serie temporal a un clic.
 */

const INK = "#A8410F"; // terracota-600: pasa contraste ≥3:1 sobre la superficie del panel
const GRID = "#EDE9DF";
const MUTED = "#6F6155";

type Range = "1" | "7" | "30" | "90";

const fmt = new Intl.NumberFormat("es");
const num = (v: number) => fmt.format(Math.round(v));
const pct = (part: number, whole: number) => (whole ? Math.round((100 * part) / whole) : 0);

function duration(ms: number) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ${s % 60} s` : `${Math.floor(m / 60)} h ${m % 60} min`;
}

let regionNames: Intl.DisplayNames | null = null;
function countryName(code: string | null) {
  if (!code) return "Desconocido";
  try {
    regionNames ??= new Intl.DisplayNames(["es"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const DURATION_LABEL: Record<string, string> = {
  dia: "1 día",
  semana: "1 semana",
  mes: "1 mes",
  seis: "6 meses",
  anio: "1 año",
};

const EVENT_LABEL: Record<string, string> = {
  pagina: "Vio",
  busqueda: "Buscó",
  ficha_vista: "Abrió la ficha",
  compartido: "Compartió",
  contacto_abierto: "Quiso escribir",
  mensaje_enviado: "Envió un mensaje",
  cuenta_creada: "Creó su cuenta",
  correo_verificado: "Confirmó su correo",
  anuncio_enviado: "Envió un anuncio",
  anuncio_editado: "Editó un anuncio",
};

/* ——— Piezas ——— */

function Card({ title, note, children, className }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cx("min-w-0 rounded-card bg-crema-050 p-5 ring-1 ring-arena-200 sm:p-6", className)}>
      <h3 className="text-[16px] font-semibold text-negro">{title}</h3>
      {note && <p className="mt-0.5 text-[14px] text-grafito-600">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Empty() {
  return <p className="text-[15px] text-grafito-600">Aún no hay datos en este periodo.</p>;
}

function Stat({ label, value, hint, delta }: { label: string; value: string; hint?: string; delta?: number | null }) {
  return (
    <div className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
      <dt className="text-[14px] text-grafito-600">{label}</dt>
      <dd className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.03em] text-negro">{value}</dd>
      {(hint || delta !== undefined) && (
        <dd className="mt-2 text-[14px] text-grafito-600">
          {delta !== undefined && delta !== null && (
            <span className={cx("font-medium", delta > 0 ? "text-exito" : delta < 0 ? "text-error" : "")}>
              {delta > 0 ? "▲" : delta < 0 ? "▼" : "="} {Math.abs(delta)} %{" "}
            </span>
          )}
          {hint}
        </dd>
      )}
    </div>
  );
}

/** Lista con barra fina: el valor siempre escrito, la barra solo compara. */
function BarList({
  rows,
  total,
  extra,
}: {
  rows: { label: string; n: number }[];
  total?: number;
  extra?: (i: number) => string | null;
}) {
  if (!rows.length) return <Empty />;
  const max = Math.max(...rows.map((r) => r.n), 1);
  const sum = total ?? rows.reduce((s, r) => s + r.n, 0);
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={`${r.label}-${i}`}>
          <div className="flex items-baseline justify-between gap-3 text-[15px]">
            <span className="min-w-0 truncate text-negro" title={r.label}>
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums text-grafito-700">
              <strong className="font-semibold text-negro">{num(r.n)}</strong>
              <span className="ml-1.5 text-[14px] text-grafito-600">{pct(r.n, sum)} %</span>
              {extra?.(i) && <span className="ml-2 text-[14px] text-grafito-600">· {extra(i)}</span>}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-arena-200" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${Math.max(2, (100 * r.n) / max)}%`, background: INK }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s * 4 >= v) ?? 10 * pow;
  return step * 4;
}

function tickLabel(t: string, bucket: "hour" | "day") {
  const d = new Date(`${t}:00`);
  return bucket === "hour"
    ? `${String(d.getHours()).padStart(2, "0")}:00`
    : new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(d).replace(".", "");
}

/** Línea de visitantes únicos con banda tenue y retícula vertical que sigue al puntero. */
function VisitorsChart({ series, bucket }: { series: AnalyticsOverview["series"]; bucket: "hour" | "day" }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = 240;
  const pad = { l: 40, r: 12, t: 12, b: 28 };
  const iw = w - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = niceMax(Math.max(...series.map((s) => s.visitors), 0));
  const x = (i: number) => pad.l + (series.length <= 1 ? iw / 2 : (i * iw) / (series.length - 1));
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(s.visitors).toFixed(1)}`).join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  const every = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(iw / 80))));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    const i = Math.round(((px - pad.l) / iw) * (series.length - 1));
    setHover(Math.min(series.length - 1, Math.max(0, i)));
  }

  const h = hover !== null ? series[hover] : null;

  return (
    <div ref={ref} className="relative">
      <svg
        width={w}
        height={H}
        role="img"
        aria-label={`Visitantes únicos por ${bucket === "hour" ? "hora" : "día"}. La tabla con los valores está debajo.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="block touch-pan-y"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={12} fill={MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>
              {num(t)}
            </text>
          </g>
        ))}
        {series.map((s, i) =>
          i % every === 0 ? (
            <text key={s.t} x={x(i)} y={H - 8} textAnchor="middle" fontSize={12} fill={MUTED}>
              {tickLabel(s.t, bucket)}
            </text>
          ) : null,
        )}
        <path d={area} fill={INK} opacity={0.1} />
        <path d={line} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {h && hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke={MUTED} strokeWidth={1} />
            <circle cx={x(hover)} cy={y(h.visitors)} r={5} fill={INK} stroke="#FBF9F5" strokeWidth={2} />
          </g>
        )}
      </svg>
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute top-2 rounded-ctl bg-negro px-3 py-2 text-[14px] text-crema-100 shadow-lg"
          style={{ left: Math.min(Math.max(x(hover) - 80, 0), w - 170), width: 170 }}
        >
          <p className="text-piedra-300">{tickLabel(h.t, bucket)}</p>
          <p>
            <strong className="font-semibold">{num(h.visitors)}</strong> visitantes
          </p>
          <p className="text-piedra-300">{num(h.pageviews)} páginas vistas</p>
        </div>
      )}
    </div>
  );
}

/** Columnas por hora del día. */
function HoursChart({ hours }: { hours: AnalyticsOverview["hours"] }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const H = 150;
  const pad = { l: 8, r: 8, t: 8, b: 24 };
  const iw = w - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = Math.max(...hours.map((h) => h.n), 1);
  const slot = iw / 24;
  const bw = Math.min(24, slot - 2);
  const peak = hours.reduce((a, b) => (b.n > a.n ? b : a), hours[0]);
  return (
    <div ref={ref}>
      <svg width={w} height={H} role="img" aria-label={`Páginas vistas por hora. Hora con más visitas: ${peak.h}:00.`}>
        {hours.map((h) => {
          const bh = (h.n / max) * ih;
          const x0 = pad.l + h.h * slot + (slot - bw) / 2;
          const y0 = pad.t + ih - bh;
          const r = Math.min(4, bh / 2, bw / 2);
          return (
            <g key={h.h}>
              <title>{`${h.h}:00 – ${num(h.n)} páginas vistas`}</title>
              <rect x={pad.l + h.h * slot} y={pad.t} width={slot} height={ih} fill="transparent" />
              {h.n > 0 && (
                <path
                  d={`M${x0},${pad.t + ih} V${y0 + r} Q${x0},${y0} ${x0 + r},${y0} H${x0 + bw - r} Q${x0 + bw},${y0} ${x0 + bw},${y0 + r} V${pad.t + ih} Z`}
                  fill={INK}
                />
              )}
              {h.h % 3 === 0 && (
                <text x={pad.l + h.h * slot + slot / 2} y={H - 6} textAnchor="middle" fontSize={12} fill={MUTED}>
                  {h.h}h
                </text>
              )}
            </g>
          );
        })}
        <line x1={pad.l} x2={w - pad.r} y1={pad.t + ih} y2={pad.t + ih} stroke={GRID} />
      </svg>
      {peak.n > 0 && (
        <p className="mt-1 text-[14px] text-grafito-600">
          Hora con más visitas: <strong className="font-semibold text-negro">{peak.h}:00</strong> (hora de El Salvador).
        </p>
      )}
    </div>
  );
}

/* ——— Pantalla ——— */

export function AdminAnalytics() {
  const [range, setRange] = useState<Range>("30");
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async (r: Range) => {
    setError("");
    try {
      const res = await fetch(`/api/admin/analytics?dias=${r}`);
      if (!res.ok) throw new Error();
      setData((await res.json()) as AnalyticsOverview);
    } catch {
      setError("No se pudo cargar la analítica.");
    }
  }, []);

  useEffect(() => {
    load(range);
    const t = window.setInterval(() => document.visibilityState === "visible" && load(range), 60_000);
    return () => window.clearInterval(t);
  }, [range, load]);

  const places = useMemo(
    () =>
      (data?.places ?? []).map((p) => ({
        label: [p.city, p.region && p.region !== p.city ? p.region : null, countryName(p.country)].filter(Boolean).join(", "),
        n: p.n,
      })),
    [data],
  );

  const t = data?.totals;
  const delta = (now: number, before: number) => (before ? Math.round((100 * (now - before)) / before) : null);
  const label = { "1": "últimas 24 horas", "7": "últimos 7 días", "30": "últimos 30 días", "90": "últimos 90 días" }[range];

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Periodo"
          value={range}
          onChange={setRange}
          options={[
            { value: "1", label: "24 horas" },
            { value: "7", label: "7 días" },
            { value: "30", label: "30 días" },
            { value: "90", label: "90 días" },
          ]}
        />
        <p className="text-[14px] text-grafito-600">
          Sin contar tus visitas de admin. Se actualiza cada minuto.
        </p>
      </div>

      {error && <p role="alert" className="text-[15px] font-medium text-error">{error}</p>}
      {!data ? (
        <div className="h-64 animate-pulse rounded-card bg-arena-200" aria-busy="true" />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <Stat label="Visitantes únicos" value={num(t!.visitors)} delta={delta(t!.visitors, t!.previousVisitors)} hint="vs periodo anterior" />
            <Stat label="Páginas vistas" value={num(t!.pageviews)} delta={delta(t!.pageviews, t!.previousPageviews)} hint="vs periodo anterior" />
            <Stat label="Visitas (sesiones)" value={num(t!.sessions)} hint={t!.sessions ? `${(t!.pageviews / t!.sessions).toFixed(1).replace(".", ",")} páginas por visita` : undefined} />
            <Stat label="Tiempo por visita" value={duration(t!.avgSessionMs)} hint="promedio" />
            <Stat label="Se fueron sin seguir" value={`${t!.bouncePct} %`} hint="vieron una sola página" />
            <Stat label="En este momento" value={num(t!.liveNow)} hint="activos en los últimos 5 min" />
          </dl>

          <Card title={`Visitantes únicos · ${label}`} note={`${num(t!.newVisitors)} nuevos y ${num(t!.returningVisitors)} que ya habían venido antes.`}>
            {t!.pageviews ? <VisitorsChart series={data.series} bucket={data.bucket as "hour" | "day"} /> : <Empty />}
            <details className="mt-3">
              <summary className="cursor-pointer text-[14px] font-medium text-terracota-700 underline underline-offset-4">Ver en tabla</summary>
              <div className="mt-3 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-[14px] tabular-nums">
                  <thead className="text-grafito-600">
                    <tr><th className="py-1.5 font-medium">{data.bucket === "hour" ? "Hora" : "Día"}</th><th className="py-1.5 text-right font-medium">Visitantes</th><th className="py-1.5 text-right font-medium">Páginas</th></tr>
                  </thead>
                  <tbody className="divide-y divide-arena-200">
                    {[...data.series].reverse().map((s) => (
                      <tr key={s.t}><td className="py-1.5">{tickLabel(s.t, data.bucket as "hour" | "day")}</td><td className="py-1.5 text-right">{num(s.visitors)}</td><td className="py-1.5 text-right">{num(s.pageviews)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="De dónde llegan" note="Visitas según la primera página que abrieron.">
              <BarList rows={data.sources} />
            </Card>
            <Card title="Desde dónde se conectan" note="Ubicación aproximada según la conexión. Visitantes únicos.">
              <BarList rows={places} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Dispositivo"><BarList rows={data.devices} /></Card>
            <Card title="Sistema"><BarList rows={data.oses} /></Card>
            <Card title="Navegador o app"><BarList rows={data.browsers} /></Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Del interés al mensaje" note="Visitantes únicos que llegaron a cada paso.">
              <BarList rows={data.funnel} total={data.funnel[0]?.n || 1} />
              <ul className="mt-5 grid grid-cols-3 gap-3 border-t border-arena-200 pt-4">
                {data.actions.map((a) => (
                  <li key={a.label}>
                    <p className="text-[24px] font-semibold leading-none text-negro">{num(a.n)}</p>
                    <p className="mt-1 text-[14px] text-grafito-600">{a.label}</p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="A qué hora entran" note="Páginas vistas por hora del día.">
              <HoursChart hours={data.hours} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Dónde quieren alquilar" note="Zona elegida en cada búsqueda · resultados promedio que encontraron.">
              <BarList rows={data.searchZones} extra={(i) => `${num(data.searchZones[i].avgResults)} resultados`} />
            </Card>
            <Card title="Por cuánto tiempo" note="Plazo elegido en las búsquedas.">
              <BarList rows={data.searchDurations.map((d) => ({ label: DURATION_LABEL[d.label] ?? d.label, n: d.n }))} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Páginas más vistas" note="Vistas · tiempo promedio en la página.">
              <BarList rows={data.pages} extra={(i) => (data.pages[i].avgMs ? duration(data.pages[i].avgMs) : null)} />
            </Card>
            <Card title="Anuncios más vistos" note="Veces que se abrió cada ficha.">
              <BarList rows={data.listings} />
            </Card>
          </div>

          <Card title="Actividad reciente" note="Lo último que pasó en el sitio, sin tus visitas de admin.">
            {data.recent.length === 0 ? (
              <Empty />
            ) : (
              <div className="-mx-1 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-[14px]">
                  <thead className="text-grafito-600">
                    <tr>
                      <th className="px-1 py-2 font-medium">Cuándo</th>
                      <th className="px-1 py-2 font-medium">Qué hizo</th>
                      <th className="px-1 py-2 font-medium">Desde</th>
                      <th className="px-1 py-2 font-medium">Dispositivo</th>
                      <th className="px-1 py-2 font-medium">Llegó por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-arena-200">
                    {data.recent.map((r, i) => (
                      <tr key={i} className="align-top">
                        <td className="whitespace-nowrap px-1 py-2 tabular-nums text-grafito-700">
                          {new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/El_Salvador" }).format(new Date(r.at))}
                        </td>
                        <td className="px-1 py-2 text-negro">
                          {EVENT_LABEL[r.name] ?? r.name}{" "}
                          <span className="text-grafito-600">
                            {r.name === "busqueda" && r.props ? `${String(r.props.zona ?? "")} · ${DURATION_LABEL[String(r.props.plazo)] ?? ""}` : r.path}
                          </span>
                        </td>
                        <td className="px-1 py-2 text-grafito-700">{r.place ? r.place.replace(/(?:^|, )([A-Z]{2})$/, (m, c: string) => m.replace(c, countryName(c))) : "—"}</td>
                        <td className="px-1 py-2 text-grafito-700">{r.device}</td>
                        <td className="px-1 py-2 text-grafito-700">{r.source || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
