import { addDays, addMonths, money } from "./format";

export type DurationKey = "dia" | "semana" | "mes" | "seis" | "anio";

export type Duration = {
  key: DurationKey;
  label: string;
  /** Short label for compact controls. */
  short: string;
  /** Unit the price is quoted in. */
  unit: "día" | "semana" | "mes";
  /** How many units the period contains. */
  units: number;
  contract: string;
};

export const DURATIONS: Duration[] = [
  { key: "dia", label: "1 día", short: "Día", unit: "día", units: 1, contract: "Estancia corta" },
  {
    key: "semana",
    label: "1 semana",
    short: "Semana",
    unit: "semana",
    units: 1,
    contract: "Estancia corta",
  },
  { key: "mes", label: "1 mes", short: "Mes", unit: "mes", units: 1, contract: "Contrato mensual" },
  {
    key: "seis",
    label: "6 meses",
    short: "6 meses",
    unit: "mes",
    units: 6,
    contract: "Contrato de 6 meses",
  },
  {
    key: "anio",
    label: "1 año",
    short: "Año",
    unit: "mes",
    units: 12,
    contract: "Contrato de 1 año",
  },
];

export const DURATION: Record<DurationKey, Duration> = Object.fromEntries(
  DURATIONS.map((d) => [d.key, d]),
) as Record<DurationKey, Duration>;

/**
 * Topes de precio del buscador, según la unidad en que se cobra cada plazo
 * (por día, por semana o por mes; 6 meses y 1 año se comparan por mes).
 * El 0 es «Sin tope» y va al final.
 */
export const PRICE_CAPS: Record<Duration["unit"], number[]> = {
  día: [25, 30, 50, 100, 0],
  semana: [100, 200, 350, 500, 0],
  mes: [100, 200, 500, 1000, 1500, 2500, 0],
};

export function endDate(start: Date, key: DurationKey) {
  switch (key) {
    case "dia":
      return addDays(start, 1);
    case "semana":
      return addDays(start, 7);
    case "mes":
      return addMonths(start, 1);
    case "seis":
      return addMonths(start, 6);
    case "anio":
      return addMonths(start, 12);
  }
}

export const isShortStay = (key: DurationKey) => key === "dia" || key === "semana";

/** "/ mes · total", "/ mes · contrato de 6 meses", "/ día · total". */
export function priceSuffix(key: DurationKey) {
  const d = DURATION[key];
  if (key === "seis" || key === "anio") return `/ mes · ${d.label}`;
  return `/ ${d.unit} · total`;
}

export function periodTotal(price: number, key: DurationKey) {
  return price * DURATION[key].units;
}

export function formatPeriodTotal(price: number, key: DurationKey) {
  const d = DURATION[key];
  if (d.units === 1) return `${money(price)} en total`;
  return `${money(price * d.units)} en ${d.label}`;
}
