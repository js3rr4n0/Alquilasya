"use client";

import dynamic from "next/dynamic";
import { LayoutGrid, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "@/lib/router";
import { DurationPicker } from "../components/DurationPicker";
import { ListingCard } from "../components/ListingCard";
import { DateField, ZoneField } from "../components/SearchBar";
import { Button, buttonClass, Container, Folio } from "../components/ui";
import { CONDITION_FILTERS } from "../data/conditions";
import type { ConditionKey, ListingSummary, MapPoint, PropertyType } from "../data/types";
import { DURATION, DURATIONS, PRICE_CAPS, type DurationKey } from "../lib/durations";
import { cx, money, plural } from "../lib/format";
import { COUNTRY, parseZone, zoneLabel } from "../lib/geo";
import { useStore } from "../lib/store";
import { send } from "../lib/track";

const ExploreMap = dynamic(() => import("../components/ExploreMap").then((m) => m.ExploreMap), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-arena-200" />,
});

const TYPES: PropertyType[] = ["Casa", "Apartamento", "Loft", "Cabaña", "Penthouse", "Estudio"];
type Sort = "recientes" | "menor" | "mayor";

export function Explore() {
  const { duration, setDuration, zone, setZone, favorites } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const z = params.get("zona");
    if (z !== null && z !== zone) setZone(z);
    const p = params.get("plazo") as DurationKey | null;
    if (p && DURATIONS.some((d) => d.key === p) && p !== duration) setDuration(p);
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const [conds, setConds] = useState<ConditionKey[]>([]);
  const [type, setType] = useState<PropertyType | "">("");
  const [beds, setBeds] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  // Cada plazo tiene sus propios topes: al cambiar de plazo, un tope que ya no aplica se quita.
  useEffect(() => {
    setMaxPrice((m) => (PRICE_CAPS[DURATION[duration].unit].includes(m) ? m : 0));
  }, [duration]);
  const [onlySaved, setOnlySaved] = useState(false);
  const [onlyForDuration, setOnlyForDuration] = useState(true);
  const [sort, setSort] = useState<Sort>("recientes");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"ambos" | "lista" | "mapa">("ambos");
  const [moreOpen, setMoreOpen] = useState(false);

  const toggleCond = (k: ConditionKey) =>
    setConds((list) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]));

  // ——— Resultados: los pide al servidor, por páginas ———
  const [results, setResults] = useState<ListingSummary[]>([]);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState<"cargando" | "listo" | "mas" | "error">("cargando");
  const [anyPublished, setAnyPublished] = useState(true);

  const query = useMemo(() => {
    const q = new URLSearchParams({ plazo: duration, solo: onlyForDuration ? "1" : "0", orden: sort });
    if (zone) q.set("zona", zone);
    if (type) q.set("tipo", type);
    if (beds > 0) q.set("cuartos", String(beds));
    if (maxPrice > 0) q.set("tope", String(maxPrice));
    if (conds.length) q.set("condiciones", conds.join(","));
    if (onlySaved) q.set("ids", favorites.slice(0, 200).join(",") || "ninguna");
    return q.toString();
  }, [duration, onlyForDuration, sort, zone, type, beds, maxPrice, conds, onlySaved, favorites]);

  // Primera página y puntos del mapa cada vez que cambia un filtro.
  useEffect(() => {
    const ctrl = new AbortController();
    setStatus("cargando");
    const t = window.setTimeout(() => {
      fetch(`/api/listings?${query}&mapa=1`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { results: ListingSummary[]; points?: MapPoint[]; total: number; pages: number }) => {
          setResults(d.results ?? []);
          setPoints(d.points ?? []);
          setTotal(d.total ?? 0);
          setPages(d.pages ?? 1);
          setPage(1);
          setStatus("listo");
          send("busqueda", {
            props: {
              zona: zone ? zoneLabel(zone) : "Todo El Salvador",
              plazo: duration,
              tipo: type || "todos",
              filtros: conds.length + (beds > 0 ? 1 : 0) + (maxPrice > 0 ? 1 : 0),
              resultados: d.total ?? 0,
            },
          });
        })
        .catch((e) => e.name !== "AbortError" && setStatus("error"));
    }, 150);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query]);

  // ¿Hay algo publicado en todo el sitio? Cambia el mensaje cuando no hay resultados.
  useEffect(() => {
    fetch("/api/listings?solo=0&limite=1")
      .then((r) => r.json())
      .then((d: { total?: number }) => setAnyPublished((d.total ?? 0) > 0))
      .catch(() => {});
  }, []);

  async function loadMore() {
    setStatus("mas");
    try {
      const d = (await (await fetch(`/api/listings?${query}&pagina=${page + 1}`)).json()) as {
        results: ListingSummary[];
      };
      setResults((r) => [...r, ...(d.results ?? []).filter((x) => !r.some((y) => y.id === x.id))]);
      setPage((n) => n + 1);
      setStatus("listo");
    } catch {
      setStatus("error");
    }
  }

  const filtered = results;

  const place = parseZone(zone);
  const focus = place?.district
    ? { lat: place.district.lat, lng: place.district.lng, zoom: 13 }
    : place
      ? { lat: place.department.lat, lng: place.department.lng, zoom: 10 }
      : COUNTRY;
  const empty = !anyPublished;

  const activeFilterCount =
    conds.length +
    (type ? 1 : 0) +
    (beds > 0 ? 1 : 0) +
    (maxPrice > 0 ? 1 : 0) +
    (onlySaved ? 1 : 0) +
    (zone ? 1 : 0);

  function clearAll() {
    setZone("");
    setConds([]);
    setType("");
    setBeds(0);
    setMaxPrice(0);
    setOnlySaved(false);
  }

  return (
    <div>
      {/* Black specimen band */}
      <section className="on-dark dots bg-negro pb-8 pt-8 text-crema-100">
        <Container>
          <Folio left="Explorar · El Salvador" right="Sin comisión · El total es el total" tone="dark" />
          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <h1 className="serif text-[44px] leading-[0.98] sm:text-[58px]">
                Casas para entrar <em className="text-terracota-300">sin</em> dudas.
              </h1>
            </div>
            <DurationPicker
              value={duration}
              onChange={setDuration}
              tone="dark"
              compact
              stretch
              className="self-start sm:w-[400px]"
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
            <ZoneField />
            <DateField />
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              className={cx(
                "inline-flex h-14 items-center justify-center gap-2 rounded-ctl px-4 text-[15px] font-medium ring-1 transition-colors",
                moreOpen || type || beds > 0 || maxPrice > 0
                  ? "bg-crema-100 text-negro ring-crema-100"
                  : "bg-crema-100/[0.07] text-crema-100 ring-crema-100/15 hover:ring-crema-100/40",
              )}
            >
              <SlidersHorizontal className="size-4" />
              Tipo, cuartos y tope
            </button>
            <button
              type="button"
              onClick={() => setOnlyForDuration((v) => !v)}
              aria-pressed={onlyForDuration}
              className={cx(
                "inline-flex h-14 items-center justify-center gap-2 rounded-ctl px-4 text-[15px] font-medium ring-1 transition-colors",
                onlyForDuration
                  ? "bg-crema-100/[0.07] text-crema-100 ring-crema-100/35"
                  : "bg-crema-100/[0.04] text-piedra-300 ring-crema-100/15",
              )}
            >
              <span
                className={cx(
                  "size-2 rounded-full",
                  onlyForDuration ? "bg-crema-100" : "bg-piedra-400",
                )}
              />
              Solo disponibles por {DURATION[duration].label}
            </button>
          </div>

          {moreOpen && (
            <div className="mt-3 grid animate-fade gap-4 rounded-card bg-tinta-900 p-4 ring-1 ring-crema-100/15 sm:grid-cols-3">
              <div>
                <p className="text-[14px] text-piedra-300">Tipo de vivienda</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setType("")}
                    className={cx(
                      "h-9 rounded-[3px] px-3 text-[14px]",
                      !type
                        ? "bg-crema-100 font-medium text-negro"
                        : "bg-crema-100/10 text-piedra-300",
                    )}
                  >
                    Todas
                  </button>
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(type === t ? "" : t)}
                      className={cx(
                        "h-9 rounded-[3px] px-3 text-[14px]",
                        type === t
                          ? "bg-crema-100 font-medium text-negro"
                          : "bg-crema-100/10 text-piedra-300 hover:text-crema-100",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[14px] text-piedra-300">Habitaciones mínimas</p>
                <div className="mt-2 flex gap-1.5">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setBeds(n)}
                      className={cx(
                        "h-9 min-w-11 rounded-[3px] px-3 text-[14px] tabular-nums",
                        beds === n
                          ? "bg-crema-100 font-semibold text-negro"
                          : "bg-crema-100/10 text-piedra-300",
                      )}
                    >
                      {n === 0 ? "Todas" : `${n}+`}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[14px] text-piedra-300">Tope por {DURATION[duration].unit}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PRICE_CAPS[DURATION[duration].unit].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMaxPrice(p)}
                      className={cx(
                        "h-9 rounded-[3px] px-3 text-[14px] tabular-nums",
                        maxPrice === p
                          ? "bg-crema-100 font-semibold text-negro"
                          : "bg-crema-100/10 text-piedra-300",
                      )}
                    >
                      {p === 0 ? "Sin tope" : `Hasta ${money(p)}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* Sticky condition filter bar */}
      <div className="z-30 border-b lg:sticky lg:top-[68px] border-piedra-250/80 bg-crema-100/95 backdrop-blur-sm">
        <Container className="flex flex-col gap-3 py-3 lg:flex-row lg:items-start lg:justify-between">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Filtrar por condiciones"
          >
            {CONDITION_FILTERS.map((f) => {
              const active = conds.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCond(f.key)}
                  className={cx(
                    "h-9 shrink-0 rounded-ctl px-3 text-[14px] font-medium transition-colors",
                    active
                      ? "bg-negro text-crema-100"
                      : "bg-crema-050 text-grafito-700 ring-1 ring-piedra-250 hover:text-negro",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
            <button
              type="button"
              aria-pressed={onlySaved}
              onClick={() => setOnlySaved((v) => !v)}
              className={cx(
                "h-9 shrink-0 rounded-ctl px-3 text-[14px] font-medium transition-colors",
                onlySaved
                  ? "bg-negro text-crema-100"
                  : "bg-crema-050 text-grafito-700 ring-1 ring-piedra-250 hover:text-negro",
              )}
            >
              Guardadas ({favorites.length})
            </button>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-8 shrink-0 items-center gap-1 px-2 text-[14px] font-medium text-terracota-700 underline underline-offset-4"
              >
                <X className="size-3.5" /> Limpiar ({activeFilterCount})
              </button>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-2 text-[14px] text-grafito-600">
              <span>Ordenar:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="cursor-pointer rounded-ctl bg-crema-050 px-2.5 py-1.5 font-medium text-negro ring-1 ring-piedra-250 outline-none"
              >
                <option value="recientes">Más recientes</option>
                <option value="menor">Menor precio</option>
                <option value="mayor">Mayor precio</option>
              </select>
            </label>
            <div
              className="inline-flex rounded-ctl bg-arena-200 p-[2px] ring-1 ring-piedra-250"
              role="group"
              aria-label="Vista"
            >
              {(
                [
                  { k: "ambos", label: "Lista y mapa", hideMobile: true },
                  { k: "lista", label: "Lista", icon: LayoutGrid },
                  { k: "mapa", label: "Mapa", icon: MapIcon },
                ] as const
              ).map((v) => {
                const Icon = "icon" in v ? v.icon : null;
                return (
                  <button
                    key={v.k}
                    type="button"
                    aria-pressed={view === v.k}
                    onClick={() => setView(v.k)}
                    className={cx(
                      "inline-flex h-8 items-center gap-1.5 rounded-[3px] px-2.5 text-[14px] font-medium",
                      "hideMobile" in v && v.hideMobile && "hidden lg:inline-flex",
                      view === v.k ? "bg-negro text-crema-100" : "text-grafito-700",
                    )}
                  >
                    {Icon && <Icon className="size-3.5" />}
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Container>
      </div>

      {/* Results + Map */}
      <Container className="py-8 lg:py-10">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[15px] text-grafito-700" aria-live="polite">
            <span className="font-semibold tabular-nums text-negro">
              {status === "cargando" ? "Buscando…" : plural(total, "propiedad", "propiedades")}
            </span>
            {zone && ` en ${zoneLabel(zone)}`} · precios por{" "}
            <span className="font-medium text-negro">{DURATION[duration].label}</span>
          </p>
          <p className="text-[14px] text-grafito-600">
            ¿Tienes un inmueble?{" "}
            <Link to="/publicar" className="font-medium text-terracota-700 underline underline-offset-4">
              Publícalo gratis
            </Link>
          </p>
        </div>

        {status === "cargando" && filtered.length === 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-card bg-arena-200" />
            ))}
          </div>
        ) : status === "error" && filtered.length === 0 ? (
          <div className="rounded-card bg-crema-050 px-6 py-14 text-center ring-1 ring-arena-200">
            <h2 className="head text-[26px]">No pudimos cargar los resultados.</h2>
            <p className="mt-2 text-[16px] text-grafito-600">Revisa tu conexión e intenta de nuevo.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid items-start gap-8 lg:grid-cols-[1.22fr_0.78fr]">
            <div className="rounded-card bg-crema-050 px-6 py-14 text-center ring-1 ring-arena-200 sm:px-10">
              <h2 className="head text-balance text-[28px]">
                {empty
                  ? "Todavía no hay alquileres publicados."
                  : zone && activeFilterCount === 1
                    ? `Aún no hay alquileres en ${zoneLabel(zone)}.`
                    : "Ningún alquiler cumple todos esos filtros a la vez."}
              </h2>
              <p className="mx-auto mt-3 max-w-[46ch] text-[16px] leading-relaxed text-grafito-600">
                {empty
                  ? "AlquilasYa está empezando. Si tienes un inmueble, publícalo gratis y sé de los primeros."
                  : "Prueba con otra zona, quita algún filtro o muestra también los que no se alquilan por ese plazo."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {!empty && onlyForDuration && (
                  <Button variant="outline" onClick={() => setOnlyForDuration(false)}>
                    Ver todos los plazos
                  </Button>
                )}
                {!empty && activeFilterCount > 0 && (
                  <Button variant="outline" onClick={clearAll}>
                    Quitar filtros
                  </Button>
                )}
                <Link to="/publicar" className={buttonClass("primary", "md")}>
                  Publicar gratis
                </Link>
              </div>
            </div>
            <div className="map-warm hidden h-[460px] overflow-hidden rounded-card ring-1 ring-arena-200 lg:block">
              <ExploreMap
                listings={[]}
                duration={duration}
                activeId={null}
                onActivate={() => {}}
                onOpen={() => {}}
                focus={focus}
                className="size-full"
              />
            </div>
          </div>
        ) : view === "mapa" ? (
          <div className="map-warm h-[74vh] min-h-[480px] overflow-hidden rounded-card ring-1 ring-arena-200">
            <ExploreMap
              listings={points}
              duration={duration}
              activeId={activeId}
              onActivate={setActiveId}
              onOpen={(id) => navigate(`/casa/${id}`)}
              focus={focus}
              className="size-full"
            />
          </div>
        ) : (
          <div
            className={cx(
              "grid items-start gap-8",
              view === "ambos" && "lg:grid-cols-[1.22fr_0.78fr]",
            )}
          >
            <div className={cx("grid gap-6 sm:grid-cols-2", view === "lista" && "lg:grid-cols-3")}>
              {filtered.map((l, i) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  duration={duration}
                  active={activeId === l.id}
                  onHover={setActiveId}
                  priority={i < 4}
                />
              ))}
              {page < pages && (
                <div className="flex flex-col items-center gap-2 sm:col-span-2 lg:col-span-full">
                  <Button variant="outline" size="lg" onClick={loadMore} disabled={status === "mas"}>
                    {status === "mas" ? "Cargando…" : "Ver más alquileres"}
                  </Button>
                  <p className="text-[14px] text-grafito-600">
                    Mostrando {filtered.length} de {total}
                  </p>
                </div>
              )}
            </div>
            {view === "ambos" && (
              <div className="map-warm sticky top-[148px] hidden h-[calc(100dvh-180px)] min-h-[520px] overflow-hidden rounded-card ring-1 ring-arena-200 lg:block">
                <ExploreMap
                  listings={points}
                  duration={duration}
                  activeId={activeId}
                  onActivate={setActiveId}
                  onOpen={(id) => navigate(`/casa/${id}`)}
                  className="size-full"
                />
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
