import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { z } from "zod";
import { hasDatabase, isUniqueViolation, query } from "@/lib/db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const COOKIE = "ay_sesion";
const DAYS = 30;

export type User = { id: string; email: string; name: string; whatsapp: string | null };

const phone = z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "Número de WhatsApp inválido");

export const registerInput = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email: z.string().trim().toLowerCase().email("Escribe un correo válido").max(255),
  password: z
    .string()
    .min(8, "La contraseña necesita al menos 8 caracteres")
    .max(200, "La contraseña es demasiado larga"),
  whatsapp: z.union([phone, z.literal("")]).optional(),
});

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido").max(255),
  password: z.string().min(1, "Escribe tu contraseña").max(200),
});

export const profileInput = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  whatsapp: z.union([phone, z.literal("")]),
});

/* ——— Contraseñas: scrypt con sal por usuario ——— */

async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return ["scrypt", salt.toString("base64"), key.toString("base64")].join(":");
}

async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, key] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Se compara contra esto cuando el correo no existe, para que tarde lo mismo. */
let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword("relleno-sin-uso"));

/* ——— Sesiones: token aleatorio en cookie httpOnly; en la base solo su hash ——— */

const digest = (token: string) => createHash("sha256").update(token).digest("hex");

async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))",
    [digest(token), userId, DAYS],
  );
  // De paso, limpia las sesiones vencidas de esta cuenta.
  await query("DELETE FROM sessions WHERE user_id = $1 AND expires_at < now()", [userId]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DAYS * 24 * 60 * 60,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token && hasDatabase()) {
    await query("DELETE FROM sessions WHERE token_hash = $1", [digest(token)]).catch(() => {});
  }
  jar.delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !hasDatabase()) return null;
  const rows = await query<User>(
    `SELECT u.id::text AS id, u.email, u.name, u.whatsapp
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [digest(token)],
  );
  return rows[0] ?? null;
}

/* ——— Altas y entradas ——— */

export async function register(input: z.infer<typeof registerInput>) {
  try {
    const rows = await query<User>(
      `INSERT INTO users (email, password_hash, name, whatsapp)
       VALUES ($1, $2, $3, $4)
       RETURNING id::text AS id, email, name, whatsapp`,
      [input.email, await hashPassword(input.password), input.name, input.whatsapp || null],
    );
    await startSession(rows[0].id);
    return rows[0];
  } catch (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
}

export async function login(input: z.infer<typeof loginInput>): Promise<User | null> {
  const rows = await query<User & { password_hash: string }>(
    "SELECT id::text AS id, email, name, whatsapp, password_hash FROM users WHERE email = $1",
    [input.email],
  );
  const row = rows[0];
  const ok = await verifyPassword(input.password, row?.password_hash ?? (await dummyHash()));
  if (!row || !ok) return null;
  await startSession(row.id);
  return { id: row.id, email: row.email, name: row.name, whatsapp: row.whatsapp };
}

export async function updateProfile(userId: string, input: z.infer<typeof profileInput>) {
  const rows = await query<User>(
    `UPDATE users SET name = $2, whatsapp = $3 WHERE id = $1
     RETURNING id::text AS id, email, name, whatsapp`,
    [userId, input.name, input.whatsapp || null],
  );
  return rows[0] ?? null;
}
