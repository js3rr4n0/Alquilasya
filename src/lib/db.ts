import { neon } from "@neondatabase/serverless";
import { SCHEMA, SCHEMA_VERSION } from "../../db/schema.mjs";

/**
 * Acceso a Postgres. En producción usa el driver HTTP de Neon (la base que
 * se conecta desde Vercel Storage); contra un Postgres local usa `pg`.
 */
type Row = Record<string, unknown>;
type Runner = (text: string, params?: unknown[]) => Promise<Row[]>;

export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export const hasDatabase = () => Boolean(databaseUrl());

let runner: Promise<Runner> | null = null;
let ready: Promise<void> | null = null;

async function createRunner(): Promise<Runner> {
  const url = databaseUrl();
  if (!url) throw new Error("DATABASE_URL no está configurada.");

  if (/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
    // `pg` es dependencia de desarrollo: el nombre va en una variable para
    // que el empaquetador no intente incluirlo en producción.
    const moduleName = "pg";
    const pg = (await import(moduleName)).default;
    const pool = new pg.Pool({ connectionString: url, max: 3 });
    return async (text, params = []) => (await pool.query(text, params)).rows as Row[];
  }

  const sql = neon(url);
  return async (text, params = []) => (await sql.query(text, params)) as Row[];
}

function getRunner() {
  runner ??= createRunner().catch((error) => {
    runner = null;
    throw error;
  });
  return runner;
}

/** Garantiza las tablas una vez por instancia del servidor. */
function ensureSchema() {
  ready ??= (async () => {
    const run = await getRunner();
    // Una sola consulta en el caso normal: el esquema ya está en esta versión.
    try {
      const meta = await run("SELECT version FROM schema_meta");
      if (Number(meta[0]?.version) === SCHEMA_VERSION) return;
    } catch {
      /* la tabla aún no existe: se crea todo abajo */
    }
    for (const statement of SCHEMA) await run(statement);
  })().catch((error) => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function query<T extends Row = Row>(text: string, params: unknown[] = []) {
  await ensureSchema();
  const run = await getRunner();
  return (await run(text, params)) as T[];
}

export function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}
