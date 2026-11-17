"use client";

import dynamic from "next/dynamic";
import { LayoutGrid, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "@/lib/router";
import { DurationPicker } from "../components/DurationPicker";
import { ListingCard } from "../components/ListingCard";
import { DateField, ZoneField } from "../components/SearchBar";
import { Button, Container, Folio } from "../components/ui";
import { CONDITION_FILTERS } from "../data/conditions";
import { ZONE_GROUPS } from "../data/listings";
import type { ConditionKey, PropertyType } from "../data/types";
import { DURATION, DURATIONS, type DurationKey } from "../lib/durations";
import { cx, money, plural } from "../lib/format";
import { useStore } from "../lib/store";

const ExploreMap = dynamic(() => import("../components/ExploreMap").then((m) => m.ExploreMap), {
  ssr: false,
  loading: () => <div className="size-full animate-pulse bg-arena-200" />,
});

const TYPES: PropertyType[] = ["Casa", "Apartamento", "Loft", "Cabaña", "Penthouse", "Estudio"];
type Sort = "recientes" | "menor" | "mayor";

export function Explore() {
  const { listings, duration, setDuration, zone, setZone, favorites } = useStore();
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
  const [onlySaved, setOnlySaved] = useState(false);
  const [onlyForDuration, setOnlyForDuration] = useState(true);
  const [sort, setSort] = useState<Sort>("recientes");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<"ambos" | "lista" | "mapa">("ambos");
  const [moreOpen, setMoreOpen] = useState(false);

  const toggleCond = (k: ConditionKey) =>
    setConds((list) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]));

  const filtered = useMemo(() => {
    const zones = zone ? [zone, ...(ZONE_GROUPS[zone] ?? [])] : null;
    const list = listings.filter((l) => {
      if (zones && !zones.includes(l.zone) && l.region !== zone) return false;
      if (onlyForDuration && !l.prices[duration]) return false;
      if (type && l.type !== type) return false;
      if (beds > 0 && l.bedrooms < beds) return false;
      const price = l.prices[duration];
      if (maxPrice > 0 && price && price > maxPrice) return false;
      if (onlySaved && !favorites.includes(l.id)) return false;
      for (const key of conds) {
        const rule = CONDITION_FILTERS.find((f) => f.key === key);
        const found = l.conditions.find((c) => c.key === key);
        if (!rule || !found || !rule.accept.includes(found.status)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      const pa = a.prices[duration] ?? 999999;
      const pb = b.prices[duration] ?? 999999;
      if (sort === "menor") return pa - pb;
      if (sort === "mayor") return pb - pa;
      // Real listings first, examples after; newest first within each group.
      return (
        Number(Boolean(a.example)) - Number(Boolean(b.example)) ||
        b.publishedAt.localeCompare(a.publishedAt)
      );
    });
  }, [
    listings,
    zone,
    onlyForDuration,
    duration,
    type,
    beds,
    maxPrice,
    onlySaved,
    favorites,
    conds,
    sort,
  ]);

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
                  {[0, 500, 1000, 1500, 2500].map((p) => (
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
              {plural(filtered.length, "propiedad", "propiedades")}
            </span>
            {zone && ` en ${zone}`} · precios por{" "}
            <span className="font-medium text-negro">{DURATION[duration].label}</span>
          </p>
          {filtered.some((l) => l.example) && (
            <p className="text-[14px] text-grafito-600">
              Los anuncios marcados «Ejemplo» son ilustrativos.{" "}
              <Link to="/publicar" className="font-medium text-terracota-700 underline underline-offset-4">
                Publica el tuyo gratis
              </Link>
            </p>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-card bg-crema-050 px-6 py-16 text-center ring-1 ring-arena-200">
            <h2 className="head text-[28px]">
              Ninguna casa cumple todas esas condiciones a la vez.
            </h2>
            <p className="mx-auto mt-3 max-w-[46ch] text-[15px] text-grafito-600">
              Prueba quitando algún filtro o mostrando también las que no se alquilan por{" "}
              {DURATION[duration].label}.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              {onlyForDuration && (
                <Button variant="outline" onClick={() => setOnlyForDuration(false)}>
                  Ver todos los plazos
                </Button>
              )}
              <Button variant="ink" onClick={clearAll}>
                Quitar filtros
              </Button>
            </div>
          </div>
        ) : view === "mapa" ? (
          <div className="map-warm h-[74vh] min-h-[480px] overflow-hidden rounded-card ring-1 ring-arena-200">
            <ExploreMap
              listings={filtered}
              duration={duration}
              activeId={activeId}
              onActivate={setActiveId}
              onOpen={(id) => navigate(`/casa/${id}`)}
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
            </div>
            {view === "ambos" && (
              <div className="map-warm sticky top-[148px] hidden h-[calc(100dvh-180px)] min-h-[520px] overflow-hidden rounded-card ring-1 ring-arena-200 lg:block">
                <ExploreMap
                  listings={filtered}
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
