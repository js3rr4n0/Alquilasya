/**
 * Planes para destacar un anuncio. Publicar sigue siendo gratis: esto es un
 * extra opcional que sube el anuncio al principio de los resultados.
 * Para cambiar precios o duraciones basta con editar esta lista.
 */
export type PlanId = "destacado_1" | "destacado_7" | "destacado_30";

export type Plan = { id: PlanId; name: string; days: number; price: number; blurb: string };

export const PLANS: Plan[] = [
  { id: "destacado_1", name: "Destacado 1 día", days: 1, price: 1, blurb: "Arriba en las búsquedas de tu zona por 24 horas." },
  { id: "destacado_7", name: "Destacado 7 días", days: 7, price: 3, blurb: "Una semana primero en tu zona. Menos de $0.45 por día." },
  { id: "destacado_30", name: "Destacado 30 días", days: 30, price: 5, blurb: "Un mes arriba en los resultados. Menos de $0.17 por día." },
];

export const planById = (id: string) => PLANS.find((p) => p.id === id);

export const usd = (n: number) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
