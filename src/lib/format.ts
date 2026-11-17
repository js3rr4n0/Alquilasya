// Numbers follow the manual's Spanish (RAE) style: decimal comma, no
// separator in 4-digit figures, a narrow space from 10 000 upwards, and a
// space between a figure and its unit ("16 px", "45 %").

const NNBSP = "\u202F";

export function num(n: number, decimals = 0): string {
  const sign = n < 0 ? "−" : "";
  const [int, dec] = Math.abs(n).toFixed(decimals).split(".");
  const grouped = int.length >= 5 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP) : int;
  return sign + (dec ? `${grouped},${dec}` : grouped);
}

export const money = (n: number, decimals = 0) => `$${num(n, decimals)}`;

/** 4 → "4", 4.5 → "4,5", 4.25 → "4,25" */
export function dec(n: number, max = 2): string {
  const fixed = n.toFixed(max).replace(/\.?0+$/, "");
  return fixed.replace(".", ",");
}

export const m2 = (n: number) => `${dec(n, 1)}${NNBSP}m²`;
export const meters = (n: number) => `${dec(n)}${NNBSP}m`;
export const pct = (n: number) => `${dec(n, 0)}${NNBSP}%`;

const dShort = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });
const dDay = new Intl.DateTimeFormat("es", { weekday: "short", day: "numeric", month: "short" });
const dMonth = new Intl.DateTimeFormat("es", { month: "long" });
const dTime = new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit", hour12: false });

export const dateShort = (d: Date) => dShort.format(d).replace(".", "");
export const dateDay = (d: Date) => dDay.format(d).replace(".", "");
export const time = (d: Date) => dTime.format(d);
export function monthYear(d: Date) {
  const m = dMonth.format(d);
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${d.getFullYear()}`;
}

export function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

export function addMonths(d: Date, months: number) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + months);
  return r;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function isoDay(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromIsoDay(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function plural(n: number, one: string, many: string) {
  return `${num(n)} ${n === 1 ? one : many}`;
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
