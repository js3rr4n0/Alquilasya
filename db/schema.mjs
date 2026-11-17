/**
 * Esquema de AlquilasYa (Postgres / Neon).
 *
 * Cada sentencia es idempotente: se puede correr las veces que haga falta.
 * Lo usan `npm run db:migrate` (y el build) y, como red de seguridad,
 * el servidor en su primer acceso a la base.
 */
export const SCHEMA = [
  // Lista de espera (ya existía en producción; se respeta su forma).
  `CREATE TABLE IF NOT EXISTS waitlist (
    id            BIGSERIAL PRIMARY KEY,
    nombre        TEXT NOT NULL,
    whatsapp      TEXT NOT NULL,
    tipo_usuario  TEXT NOT NULL,
    departamento  TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    origen        TEXT NOT NULL DEFAULT 'organico',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'organico'`,
  `ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`,

  // Anuncios. Las columnas sueltas sirven para filtrar y moderar;
  // `data` guarda la ficha completa (plano, condiciones, precios por plazo).
  `CREATE TABLE IF NOT EXISTS listings (
    id                TEXT PRIMARY KEY,
    status            TEXT NOT NULL DEFAULT 'pendiente'
                      CHECK (status IN ('pendiente', 'publicada', 'rechazada', 'pausada')),
    title             TEXT NOT NULL,
    type              TEXT NOT NULL,
    zone              TEXT NOT NULL,
    region            TEXT NOT NULL,
    bedrooms          INTEGER NOT NULL DEFAULT 0,
    bathrooms         NUMERIC(3,1) NOT NULL DEFAULT 1,
    area              NUMERIC(8,1) NOT NULL DEFAULT 0,
    price_month       NUMERIC(10,2),
    deposit           NUMERIC(10,2) NOT NULL DEFAULT 0,
    data              JSONB NOT NULL,
    contact_name      TEXT NOT NULL,
    contact_whatsapp  TEXT NOT NULL,
    contact_email     TEXT,
    plan              TEXT NOT NULL DEFAULT 'gratis',
    owner_token       TEXT NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at      TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS listings_status_idx ON listings (status, published_at DESC)`,
  `CREATE INDEX IF NOT EXISTS listings_zone_idx ON listings (zone)`,

  // Mensajes de quien busca hacia quien publica.
  `CREATE TABLE IF NOT EXISTS inquiries (
    id             BIGSERIAL PRIMARY KEY,
    listing_id     TEXT NOT NULL,
    listing_title  TEXT NOT NULL,
    is_example     BOOLEAN NOT NULL DEFAULT false,
    nombre         TEXT NOT NULL,
    whatsapp       TEXT NOT NULL,
    mensaje        TEXT NOT NULL,
    plazo          TEXT,
    desde          DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS inquiries_listing_idx ON inquiries (listing_id, created_at DESC)`,
];
