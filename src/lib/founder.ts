/**
 * Insignia «Miembro fundador»: la tienen las cuentas creadas antes del 1 de enero
 * de 2027 a medianoche, hora de El Salvador (UTC−6). La fecha sale de la cuenta,
 * así que nadie la puede pedir ni quitar a mano.
 */
export const FOUNDER_UNTIL = "2027-01-01T06:00:00Z";

export const isFounder = (createdAt: string | Date) =>
  new Date(createdAt).getTime() < Date.parse(FOUNDER_UNTIL);

/** «noviembre de 2026», para «En AlquilasYa desde…». */
export const memberSince = (iso: string) =>
  new Intl.DateTimeFormat("es", { month: "long", year: "numeric", timeZone: "America/El_Salvador" }).format(
    new Date(iso),
  );
