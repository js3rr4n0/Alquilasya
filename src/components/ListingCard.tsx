"use client";

import { Heart } from "lucide-react";
import { Link } from "@/lib/router";
import type { ConditionKey, Listing } from "../data/types";
import { DURATION, priceSuffix, type DurationKey } from "../lib/durations";
import { cx, m2, money } from "../lib/format";
import { photoSrcSet, photoUrl } from "../lib/photos";
import { useStore } from "../lib/store";

const CARD_FACTS: { key: ConditionKey; label: string }[] = [
  { key: "mascotas", label: "Mascotas" },
  { key: "amueblado", label: "Amueblado" },
  { key: "invitados", label: "Invitados" },
];

export function roomsLabel(l: Listing) {
  return l.bedrooms === 0 ? "1 ambiente" : `${l.bedrooms} hab`;
}

export function spaceCount(l: Listing) {
  return l.floors.reduce((n, f) => n + f.rooms.length, 0);
}

export function SaveButton({
  id,
  className,
  tone = "light",
}: {
  id: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const { favorites, toggleFavorite } = useStore();
  const saved = favorites.includes(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggleFavorite(id);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Quitar de guardadas" : "Guardar"}
      className={cx(
        "inline-flex size-9 items-center justify-center rounded-ctl transition-colors",
        tone === "dark" ? "text-crema-100 hover:bg-crema-100/10" : "text-negro hover:bg-arena-200",
        className,
      )}
    >
      <Heart
        className={cx("size-[18px]", saved && (tone === "dark" ? "fill-crema-100" : "fill-negro"))}
      />
    </button>
  );
}

/**
 * Photo on top with no text over it; data below, always in the same order:
 * price, type · rooms · area, place, and three written conditions.
 */
export function ListingCard({
  listing,
  duration,
  active,
  onHover,
  priority,
  className,
}: {
  listing: Listing;
  duration: DurationKey;
  active?: boolean;
  onHover?: (id: string | null) => void;
  priority?: boolean;
  className?: string;
}) {
  const price = listing.prices[duration];
  const href = `/casa/${listing.id}`;
  return (
    <article
      onMouseEnter={() => onHover?.(listing.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cx(
        "group relative flex flex-col overflow-hidden rounded-card bg-crema-050 ring-1 transition-[box-shadow,transform] duration-300",
        active ? "ring-negro" : "ring-arena-200 hover:ring-piedra-250",
        className,
      )}
    >
      <Link
        to={href}
        className="block aspect-[4/3] overflow-hidden bg-arena-200"
        tabIndex={-1}
        aria-hidden
      >
        <img
          src={photoUrl(listing.cover, 800, 600)}
          srcSet={photoSrcSet(listing.cover, [480, 800, 1200], 0.75)}
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 92vw"
          alt=""
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="size-full object-cover transition-transform duration-[900ms] ease-umbral group-hover:scale-[1.035]"
        />
      </Link>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-2">
          <Link to={href} className="min-w-0 outline-offset-4">
            {price ? (
              <p className="leading-tight">
                <span className="text-[20px] font-semibold tabular-nums tracking-[-0.025em] text-negro">
                  {money(price)}
                </span>{" "}
                <span className="text-[14px] text-grafito-600">{priceSuffix(duration)}</span>
              </p>
            ) : (
              <p className="pt-1 text-[14px] leading-tight text-grafito-600">
                No se alquila por {DURATION[duration].label}
                <span className="block text-[14px]">
                  Desde {money(Object.values(listing.prices)[0] ?? 0)} /{" "}
                  {DURATION[Object.keys(listing.prices)[0] as DurationKey].unit}
                </span>
              </p>
            )}
            <span className="mt-1 block text-[14px] text-grafito-700">
              {listing.type} · {roomsLabel(listing)} · {m2(listing.area)}
            </span>
            <span className="sr-only">, {listing.title}</span>
          </Link>
          <div className="-mr-1.5 -mt-1 flex items-center gap-1">
            {listing.promoted && (
              <span
                className="label-sm rounded-[3px] border border-piedra-250 px-1.5 py-[3px] text-grafito-600"
                title="Pagado por el propietario para aparecer primero. No cambia el precio ni las condiciones."
              >
                Anuncio
              </span>
            )}
            {listing.example && (
              <span
                className="label-sm rounded-[3px] border border-piedra-250 px-1.5 py-[3px] text-grafito-600"
                title="Anuncio ilustrativo: no corresponde a un inmueble disponible."
              >
                Ejemplo
              </span>
            )}
            {listing.isNew && (
              <span className="label-sm rounded-[3px] bg-negro px-1.5 py-[3px] text-crema-100">
                Tuyo
              </span>
            )}
            <SaveButton id={listing.id} />
          </div>
        </div>
        <p className="mt-2 text-[14px] font-medium text-grafito-600">
          {listing.zone} · {listing.region}
        </p>
        <dl className="mt-3.5 space-y-1 border-t border-arena-200 pt-3 text-[14px] text-grafito-700">
          {CARD_FACTS.map((f) => {
            const c = listing.conditions.find((x) => x.key === f.key);
            if (!c) return null;
            return (
              <div key={f.key} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-grafito-600">{f.label}</dt>
                <dd className="truncate text-right font-medium text-negro" title={c.value}>
                  {c.value}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </article>
  );
}
