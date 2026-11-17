#!/usr/bin/env node
/**
 * Crea o actualiza las tablas de AlquilasYa.
 *
 *   npm run db:migrate
 *
 * Lee DATABASE_URL (o POSTGRES_URL, que es la que deja la integración de
 * Vercel Storage). Corre también antes de cada build: si no hay base
 * conectada todavía, avisa y sigue, para no tumbar el despliegue.
 */
import { SCHEMA } from "../db/schema.mjs";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const strict = process.argv.includes("--strict");

if (!url) {
  console.warn("[db] Sin DATABASE_URL: se omite la migración.");
  process.exit(strict ? 1 : 0);
}

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

try {
  if (isLocal) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    for (const statement of SCHEMA) await client.query(statement);
    await client.end();
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    for (const statement of SCHEMA) await sql.query(statement);
  }
  console.log(`[db] Esquema al día (${SCHEMA.length} sentencias).`);
} catch (error) {
  console.error("[db] La migración falló:", error?.message ?? error);
  process.exit(strict ? 1 : 0);
}
