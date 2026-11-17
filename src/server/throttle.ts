import { query } from "@/lib/db";

/**
 * Freno de intentos guardado en la base, así vale entre instancias del servidor
 * (el contador en memoria de `http.ts` solo corta ráfagas dentro de una).
 *
 * Devuelve true si la acción se permite y la deja registrada.
 */
export async function allow(key: string, max: number, windowMinutes: number) {
  const rows = await query<{ n: number }>(
    "SELECT count(*)::int AS n FROM rate_events WHERE key = $1 AND at > now() - make_interval(mins => $2)",
    [key, windowMinutes],
  );
  if ((rows[0]?.n ?? 0) >= max) return false;
  await query("INSERT INTO rate_events (key) VALUES ($1)", [key]);
  // Limpieza ocasional de registros viejos.
  if (Math.random() < 0.02) {
    await query("DELETE FROM rate_events WHERE at < now() - interval '1 day'").catch(() => {});
  }
  return true;
}

/** Olvida los intentos de una clave (por ejemplo, tras entrar correctamente). */
export async function forget(key: string) {
  await query("DELETE FROM rate_events WHERE key = $1", [key]).catch(() => {});
}
