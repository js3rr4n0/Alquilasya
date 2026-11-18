"use client";

import {
  LOGO_ALQUILAS,
  LOGO_HEIGHT,
  LOGO_MICRO,
  LOGO_VIEWBOX,
  LOGO_WIDTH,
  LOGO_YA,
  SYMBOL_ARMS,
  SYMBOL_HEIGHT,
  SYMBOL_MICRO,
  SYMBOL_PILLAR,
  SYMBOL_WIDTH,
} from "./logo-paths";

const INK = "#0A0A0A";
const CREAM = "#F5F2EB";
const TERRACOTA = "#D4541A";
const TERRACOTA_600 = "#A8410F";

export type LogoTone = "tinta" | "crema" | "dos-tintas" | "dos-tintas-oscuro";

/**
 * El logotipo es un vector oficial, nunca se recompone con tipografía.
 * Reglas del manual: monotono por defecto; micro (sin corte) por debajo de
 * 180 px de ancho. Dos tintas («Ya» en terracota) desde 180 px: decisión de la
 * marca para que la Y se vea terracota también en el teléfono.
 */
export function Logotipo({
  width = 180,
  tone = "tinta",
  className,
  title = "AlquilasYa",
}: {
  width?: number;
  tone?: LogoTone;
  className?: string;
  title?: string;
}) {
  const micro = width < 180;
  const twoTone = !micro && (tone === "dos-tintas" || tone === "dos-tintas-oscuro");
  const base = tone === "crema" || tone === "dos-tintas-oscuro" ? CREAM : INK;
  const height = (width * LOGO_HEIGHT) / LOGO_WIDTH;

  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      width={width}
      height={height}
      role="img"
      aria-label={title}
      className={className}
    >
      {micro ? (
        <path d={LOGO_MICRO} fill={base} />
      ) : (
        <>
          <path d={LOGO_ALQUILAS} fill={base} />
          <path d={LOGO_YA} fill={twoTone ? TERRACOTA : base} />
        </>
      )}
    </svg>
  );
}

/** The Y Umbral alone. `height` in px; below 28 px the cut closes (micro). */
export function Simbolo({
  height = 48,
  tone = "tinta",
  className,
  title,
}: {
  height?: number;
  tone?: LogoTone;
  className?: string;
  title?: string;
}) {
  const micro = height < 28;
  const base = tone === "crema" || tone === "dos-tintas-oscuro" ? CREAM : INK;
  const pillar = tone === "dos-tintas" || tone === "dos-tintas-oscuro" ? TERRACOTA : base;
  const width = (height * SYMBOL_WIDTH) / SYMBOL_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${SYMBOL_WIDTH} ${SYMBOL_HEIGHT}`}
      width={width}
      height={height}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {micro ? (
        <path d={SYMBOL_MICRO} fill={base} />
      ) : (
        <>
          <path d={SYMBOL_ARMS} fill={base} />
          <path d={SYMBOL_PILLAR} fill={pillar} />
        </>
      )}
    </svg>
  );
}

/** App icon / avatar. Square, no radius. */
export function Sello({
  size = 40,
  tone = "terracota",
  className,
  title,
}: {
  size?: number;
  tone?: "terracota" | "negro";
  className?: string;
  title?: string;
}) {
  // The Y sits at ~54 % of the square, centred.
  const yHeight = size * 0.54;
  const micro = yHeight < 28;
  const scale = yHeight / SYMBOL_HEIGHT;
  const yWidth = SYMBOL_WIDTH * scale;
  const tx = (size - yWidth) / 2;
  const ty = (size - yHeight) / 2;
  const bg = tone === "terracota" ? TERRACOTA_600 : INK;
  const pillar = tone === "negro" ? TERRACOTA : CREAM;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      <rect width={size} height={size} fill={bg} />
      <g transform={`translate(${tx} ${ty}) scale(${scale})`}>
        {micro ? (
          <path d={SYMBOL_MICRO} fill={CREAM} />
        ) : (
          <>
            <path d={SYMBOL_ARMS} fill={CREAM} />
            <path d={SYMBOL_PILLAR} fill={pillar} />
          </>
        )}
      </g>
    </svg>
  );
}

/** Sello + logotipo. Never the loose symbol in front of the name. */
export function Lockup({
  width = 220,
  tone = "tinta",
  className,
}: {
  width?: number;
  tone?: "tinta" | "crema";
  className?: string;
}) {
  // Sello height = logotype height; gap = 0.36 × sello.
  const ratio = LOGO_HEIGHT / LOGO_WIDTH;
  const logoWidth = width / (1 + ratio * 1.36);
  const sello = logoWidth * ratio;
  const logoTone: LogoTone = tone === "crema" ? "dos-tintas-oscuro" : "dos-tintas";
  return (
    <span className={`inline-flex items-center ${className ?? ""}`} style={{ gap: sello * 0.36 }}>
      <Sello size={Math.round(sello)} />
      <Logotipo width={logoWidth} tone={logoTone} />
    </span>
  );
}
