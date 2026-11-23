/**
 * Esquema de AlquilasYa (Postgres / Neon).
 *
 * Cada sentencia es idempotente: se puede correr las veces que haga falta.
 * Lo usan `npm run db:migrate` (y el build) y, como red de seguridad,
 * el servidor en su primer acceso a la base.
 */
import { DEPARTMENTS, DISTRICTS, MUNICIPALITIES } from "./geo.mjs";

/** Súbelo al cambiar el esquema: el servidor vuelve a aplicarlo una vez. */
export const SCHEMA_VERSION = 13;

const q = (value) => `'${String(value).replace(/'/g, "''")}'`;
const rows = (list, each) => list.map((item) => `(${each(item).join(", ")})`).join(",\n    ");

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS schema_meta (
    id       BOOLEAN PRIMARY KEY DEFAULT true CHECK (id),
    version  INTEGER NOT NULL
  )`,
  // Último valor de DB_RESET aplicado (ver scripts/migrate.mjs).
  `ALTER TABLE schema_meta ADD COLUMN IF NOT EXISTS reset_token TEXT`,

  // División territorial vigente (2024): departamento → municipio → distrito.
  `CREATE TABLE IF NOT EXISTS departments (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    lat   DOUBLE PRECISION NOT NULL,
    lng   DOUBLE PRECISION NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS municipalities (
    id             INTEGER PRIMARY KEY,
    department_id  TEXT NOT NULL REFERENCES departments (id),
    name           TEXT NOT NULL,
    lat            DOUBLE PRECISION NOT NULL,
    lng            DOUBLE PRECISION NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS districts (
    id               INTEGER PRIMARY KEY,
    municipality_id  INTEGER NOT NULL REFERENCES municipalities (id),
    name             TEXT NOT NULL,
    lat              DOUBLE PRECISION NOT NULL,
    lng              DOUBLE PRECISION NOT NULL
  )`,
  `INSERT INTO departments (id, name, lat, lng) VALUES
    ${rows(DEPARTMENTS, ([id, name, lat, lng]) => [q(id), q(name), lat, lng])}
   ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, lat = EXCLUDED.lat, lng = EXCLUDED.lng`,
  `INSERT INTO municipalities (id, department_id, name, lat, lng) VALUES
    ${rows(MUNICIPALITIES, ([id, dep, name, lat, lng]) => [id, q(dep), q(name), lat, lng])}
   ON CONFLICT (id) DO UPDATE SET department_id = EXCLUDED.department_id, name = EXCLUDED.name,
     lat = EXCLUDED.lat, lng = EXCLUDED.lng`,
  `INSERT INTO districts (id, municipality_id, name, lat, lng) VALUES
    ${rows(DISTRICTS, ([id, muni, name, lat, lng]) => [id, muni, q(name), lat, lng])}
   ON CONFLICT (id) DO UPDATE SET municipality_id = EXCLUDED.municipality_id, name = EXCLUDED.name,
     lat = EXCLUDED.lat, lng = EXCLUDED.lng`,

  // Cuentas. La contraseña se guarda como hash scrypt; la sesión, como hash del token.
  `CREATE TABLE IF NOT EXISTS users (
    id             BIGSERIAL PRIMARY KEY,
    email          TEXT NOT NULL UNIQUE,
    password_hash  TEXT NOT NULL,
    name           TEXT NOT NULL,
    whatsapp       TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash  TEXT PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ`,

  // Códigos de un solo uso enviados por correo (verificar la cuenta o cambiar la contraseña).
  `CREATE TABLE IF NOT EXISTS email_codes (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    purpose     TEXT NOT NULL CHECK (purpose IN ('verificar', 'restablecer')),
    code_hash   TEXT NOT NULL,
    attempts    INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at  TIMESTAMPTZ NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS email_codes_user_idx ON email_codes (user_id, purpose)`,

  // Freno de intentos que sobrevive entre instancias del servidor.
  `CREATE TABLE IF NOT EXISTS rate_events (
    key  TEXT NOT NULL,
    at   TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS rate_events_key_idx ON rate_events (key, at)`,

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
  // La tabla anterior guardaba la fecha en "fecha_registro": se conserva como fecha real.
  `DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'waitlist' AND column_name = 'fecha_registro') THEN
       UPDATE waitlist SET created_at = fecha_registro
        WHERE fecha_registro IS NOT NULL AND created_at > fecha_registro;
     END IF;
   END $$`,

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
    user_id           BIGINT REFERENCES users (id) ON DELETE CASCADE,
    district_id       INTEGER REFERENCES districts (id),
    lat               DOUBLE PRECISION,
    lng               DOUBLE PRECISION,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    published_at      TIMESTAMPTZ
  )`,
  // Bases creadas con la primera versión del esquema.
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users (id) ON DELETE CASCADE`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts (id)`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION`,
  `ALTER TABLE listings DROP COLUMN IF EXISTS owner_token`,
  // Cuándo editó el anuncio su dueño por última vez (el admin lo ve como «Editado»).
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS listings_user_idx ON listings (user_id)`,
  `CREATE INDEX IF NOT EXISTS listings_district_idx ON listings (district_id)`,
  `CREATE INDEX IF NOT EXISTS listings_status_idx ON listings (status, published_at DESC)`,
  // Búsqueda: los publicados por distrito, tipo y cuartos.
  `CREATE INDEX IF NOT EXISTS listings_public_district_idx ON listings (district_id, published_at DESC) WHERE status = 'publicada'`,
  `CREATE INDEX IF NOT EXISTS listings_public_type_idx ON listings (type, bedrooms) WHERE status = 'publicada'`,

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

  // Chat privado: una conversación por anuncio y persona interesada.
  `CREATE TABLE IF NOT EXISTS conversations (
    id               BIGSERIAL PRIMARY KEY,
    listing_id       TEXT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    renter_id        BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    owner_id         BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    renter_read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    owner_read_at    TIMESTAMPTZ NOT NULL DEFAULT 'epoch',
    UNIQUE (listing_id, renter_id)
  )`,
  `CREATE INDEX IF NOT EXISTS conversations_renter_idx ON conversations (renter_id, last_message_at DESC)`,
  `CREATE INDEX IF NOT EXISTS conversations_owner_idx ON conversations (owner_id, last_message_at DESC)`,
  `CREATE TABLE IF NOT EXISTS messages (
    id               BIGSERIAL PRIMARY KEY,
    conversation_id  BIGINT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id        BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    body             TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages (conversation_id, id)`,

  // Analítica propia. Sin IP completa: solo una huella cifrada para contar únicos,
  // y la ubicación aproximada que Vercel deduce de la IP.
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id             BIGSERIAL PRIMARY KEY,
    at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    name           TEXT NOT NULL,
    visitor_id     TEXT NOT NULL,
    session_id     TEXT NOT NULL,
    user_id        BIGINT,
    path           TEXT,
    referrer_host  TEXT,
    utm_source     TEXT,
    utm_medium     TEXT,
    utm_campaign   TEXT,
    country        TEXT,
    region         TEXT,
    city           TEXT,
    lat            DOUBLE PRECISION,
    lng            DOUBLE PRECISION,
    timezone       TEXT,
    device         TEXT,
    os             TEXT,
    browser        TEXT,
    screen         TEXT,
    lang           TEXT,
    ip_hash        TEXT,
    duration_ms    INTEGER,
    props          JSONB
  )`,
  `CREATE INDEX IF NOT EXISTS analytics_at_idx ON analytics_events (at DESC)`,
  `CREATE INDEX IF NOT EXISTS analytics_name_at_idx ON analytics_events (name, at DESC)`,
  `CREATE INDEX IF NOT EXISTS analytics_session_idx ON analytics_events (session_id, at)`,

  // v9: anuncios destacados pagados con Wompi.
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ`,
  `CREATE INDEX IF NOT EXISTS listings_featured_idx ON listings (featured_until) WHERE featured_until IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS payments (
    id            TEXT PRIMARY KEY,
    listing_id    TEXT REFERENCES listings (id) ON DELETE SET NULL,
    user_id       BIGINT REFERENCES users (id) ON DELETE SET NULL,
    listing_title TEXT NOT NULL,
    user_email    TEXT NOT NULL,
    plan          TEXT NOT NULL,
    days          INTEGER NOT NULL,
    amount        NUMERIC(10,2) NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (status IN ('pendiente', 'pagada', 'fallida', 'vencida')),
    wompi_link_id BIGINT,
    wompi_url     TEXT,
    wompi_tx_id   TEXT UNIQUE,
    live          BOOLEAN,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at       TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS payments_user_idx ON payments (user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS payments_created_idx ON payments (created_at DESC)`,
  // v10: publicación automática; si el filtro marca algo, aquí queda el motivo.
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS review_reason TEXT`,
  // v11: avisos por correo y reportes de anuncios.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notices BOOLEAN NOT NULL DEFAULT true`,
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS renter_notified_at TIMESTAMPTZ`,
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS owner_notified_at TIMESTAMPTZ`,
  `ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_notice_for TIMESTAMPTZ`,
  `CREATE TABLE IF NOT EXISTS reports (
    id            BIGSERIAL PRIMARY KEY,
    listing_id    TEXT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    user_id       BIGINT REFERENCES users (id) ON DELETE SET NULL,
    reporter_key  TEXT NOT NULL,
    reason        TEXT NOT NULL,
    details       TEXT,
    status        TEXT NOT NULL DEFAULT 'abierto' CHECK (status IN ('abierto', 'resuelto')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at   TIMESTAMPTZ,
    UNIQUE (listing_id, reporter_key)
  )`,
  `CREATE INDEX IF NOT EXISTS reports_open_idx ON reports (status, created_at DESC)`,
  // v12: anuncios guardados en la cuenta (también viven en el navegador).
  `CREATE TABLE IF NOT EXISTS saved_listings (
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    listing_id  TEXT NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, listing_id)
  )`,

  // v13: respuestas rápidas propias para el chat.
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS quick_replies JSONB NOT NULL DEFAULT '[]'::jsonb`,

  `INSERT INTO schema_meta (id, version) VALUES (true, ${SCHEMA_VERSION})
   ON CONFLICT (id) DO UPDATE SET version = EXCLUDED.version`,
];
