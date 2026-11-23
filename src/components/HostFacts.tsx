import { Award, BadgeCheck, CalendarDays, Home } from "lucide-react";
import type { Host } from "../data/types";
import { memberSince } from "../lib/founder";
import { cx } from "../lib/format";

/** Insignia de quien se registró antes de 2027. */
export function FounderBadge({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span
      title="Se registró en AlquilasYa antes del 1 de enero de 2027"
      className={cx(
        "inline-flex items-center gap-1 rounded-[3px] px-2 py-[3px] text-[13px] font-semibold leading-[18px]",
        dark ? "bg-terracota-300/15 text-terracota-200" : "bg-terracota-050 text-terracota-700 ring-1 ring-terracota-100",
        className,
      )}
    >
      <Award className="size-3.5" aria-hidden />
      Miembro fundador
    </span>
  );
}

/**
 * Quién publica (HU-04): solo datos que salen de su cuenta, ninguno escrito a mano.
 * `compact` es una sola línea para el panel de precio y la ventana de escribir.
 */
export function HostFacts({ host, compact = false, className }: { host: Host; compact?: boolean; className?: string }) {
  const since = `En AlquilasYa desde ${memberSince(host.since)}`;
  const count = host.listings === 1 ? "1 anuncio publicado" : `${host.listings} anuncios publicados`;

  if (compact) {
    return (
      <p className={cx("flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-grafito-600", className)}>
        <span>{since}</span>
        {host.verified && (
          <span className="inline-flex items-center gap-1 text-exito">
            <BadgeCheck className="size-4" aria-hidden /> Correo verificado
          </span>
        )}
        {host.founder && <FounderBadge />}
      </p>
    );
  }

  return (
    <ul className={cx("flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-grafito-700", className)}>
      <li className="inline-flex items-center gap-1.5">
        <CalendarDays className="size-4 text-grafito-600" aria-hidden /> {since}
      </li>
      {host.verified && (
        <li className="inline-flex items-center gap-1.5 text-exito">
          <BadgeCheck className="size-4" aria-hidden /> Correo verificado
        </li>
      )}
      {host.listings > 0 && (
        <li className="inline-flex items-center gap-1.5">
          <Home className="size-4 text-grafito-600" aria-hidden /> {count}
        </li>
      )}
      {host.founder && (
        <li>
          <FounderBadge />
        </li>
      )}
    </ul>
  );
}
