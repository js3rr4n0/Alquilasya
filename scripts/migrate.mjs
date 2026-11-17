#!/usr/bin/env node
/**
 * Crea o actualiza las tablas de AlquilasYa.
 *
 *   npm run db:migrate
 *
 * Lee DATABASE_URL (o POSTGRES_URL, que es la que deja la integración de
 * Vercel Storage). Corre también antes de cada build: si no hay base
 * conectada todavía, avisa y sigue, para no tumbar el despliegue.
 *
 * Reinicio total (BORRA TODO, también la lista de espera):
 *   pon la variable DB_RESET con un valor nuevo, por ejemplo la fecha
 *   («2026-11-17»), y vuelve a desplegar. Cada valor se aplica una sola vez:
 *   dejarla puesta no vuelve a borrar nada en los siguientes despliegues.
 */
import { SCHEMA } from "../db/schema.mjs";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const strict = process.argv.includes("--strict");
const reset = (process.env.DB_RESET ?? "").trim();

/** Todas las tablas de la aplicación, en orden de borrado. */
const TABLES = [
  "messages",
  "conversations",
  "inquiries",
  "listings",
  "email_codes",
  "sessions",
  "rate_events",
  "users",
  "districts",
  "municipalities",
  "departments",
  "waitlist",
  "schema_meta",
];

if (!url) {
  console.warn("[db] Sin DATABASE_URL: se omite la migración.");
  process.exit(strict ? 1 : 0);
}

async function connect() {
  if (/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    return {
      run: async (text, params = []) => (await client.query(text, params)).rows,
      close: () => client.end(),
    };
  }
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(url);
  return { run: (text, params = []) => sql.query(text, params), close: async () => {} };
}

try {
  const db = await connect();

  if (reset) {
    // ¿Este valor de DB_RESET ya se aplicó? Entonces no se toca nada.
    const applied = await db
      .run("SELECT reset_token FROM schema_meta")
      .then((rows) => rows[0]?.reset_token ?? null)
      .catch(() => null);
    if (applied === reset) {
      console.log(`[db] DB_RESET «${reset}» ya se aplicó antes: no se borra nada.`);
    } else {
      console.warn(`[db] DB_RESET «${reset}»: borrando todas las tablas…`);
      await db.run(`DROP TABLE IF EXISTS ${TABLES.join(", ")} CASCADE`);
    }
  }

  for (const statement of SCHEMA) await db.run(statement);
  if (reset) await db.run("UPDATE schema_meta SET reset_token = $1", [reset]);

  await db.close();
  console.log(`[db] Esquema al día (${SCHEMA.length} sentencias).`);
} catch (error) {
  console.error("[db] La migración falló:", error?.message ?? error);
  process.exit(strict ? 1 : 0);
}
