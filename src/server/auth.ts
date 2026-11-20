import {
  createHash,
  randomBytes,
  randomInt,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { z } from "zod";
import { hasDatabase, isUniqueViolation, query } from "@/lib/db";
import { sendCode } from "./mail";
import { allow, forget } from "./throttle";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

const COOKIE = "ay_sesion";
const DAYS = 30;
const CODE_MINUTES = 15;
const CODE_ATTEMPTS = 5;

export type User = {
  id: string;
  email: string;
  name: string;
  whatsapp: string | null;
  /** El correo fue confirmado con el código. */
  verified: boolean;
  /** Cuenta verificada cuyo correo está en ADMIN_EMAILS. */
  admin: boolean;
  /** Acepta avisos por correo (mensajes nuevos, destacado por vencer…). */
  notices: boolean;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  whatsapp: string | null;
  email_verified_at: string | null;
  email_notices: boolean;
};

const USER_COLUMNS = "id::text AS id, email, name, whatsapp, email_verified_at, email_notices";

function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function toUser(row: UserRow): User {
  const verified = Boolean(row.email_verified_at);
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    whatsapp: row.whatsapp,
    verified,
    // Sin verificar no hay admin: nadie se adelanta registrando el correo de otra persona.
    admin: verified && adminEmails().includes(row.email),
    notices: row.email_notices !== false,
  };
}

const phone = z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "Número de WhatsApp inválido");
const email = z.string().trim().toLowerCase().email("Escribe un correo válido").max(255);
const password = z
  .string()
  .min(8, "La contraseña necesita al menos 8 caracteres")
  .max(200, "La contraseña es demasiado larga");
const code = z.string().trim().regex(/^\d{6}$/, "El código tiene 6 dígitos");

export const registerInput = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  email,
  password,
  whatsapp: z.union([phone, z.literal("")]).optional(),
});
export const loginInput = z.object({
  email,
  password: z.string().min(1, "Escribe tu contraseña").max(200),
});
export const profileInput = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(80),
  whatsapp: z.union([phone, z.literal("")]),
  notices: z.boolean().optional(),
});
export const codeInput = z.object({ code });
export const forgotInput = z.object({ email });
export const resetInput = z.object({ email, code, password });

/** Error con un mensaje que se puede mostrar tal cual. */
export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/* ——— Contraseñas: scrypt con sal por usuario ——— */

async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64);
  return ["scrypt", salt.toString("base64"), key.toString("base64")].join(":");
}

async function verifyPassword(pw: string, stored: string) {
  const [scheme, salt, key] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const actual = await scrypt(pw, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/** Se compara contra esto cuando el correo no existe, para que tarde lo mismo. */
let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword("relleno-sin-uso"));

/* ——— Sesiones: token aleatorio en cookie httpOnly; en la base solo su hash ——— */

const digest = (value: string) => createHash("sha256").update(value).digest("hex");

async function startSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))",
    [digest(token), userId, DAYS],
  );
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
  const rows = await query<UserRow>(
    `SELECT u.id::text AS id, u.email, u.name, u.whatsapp, u.email_verified_at, u.email_notices
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [digest(token)],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

/* ——— Códigos por correo ——— */

type Purpose = "verificar" | "restablecer";

const codeHash = (userId: string, purpose: Purpose, value: string) =>
  digest(`${userId}:${purpose}:${value}`);

/** Crea un código nuevo (invalida los anteriores) y lo envía. Máximo 5 por hora. */
async function issueCode(user: { id: string; email: string }, purpose: Purpose) {
  if (!(await allow(`codigo:${purpose}:${user.id}`, 5, 60))) {
    throw new AuthError("Ya enviamos varios códigos. Espera un rato antes de pedir otro.", 429);
  }
  const value = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await query("DELETE FROM email_codes WHERE user_id = $1 AND purpose = $2", [user.id, purpose]);
  await query(
    `INSERT INTO email_codes (user_id, purpose, code_hash, expires_at)
     VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
    [user.id, purpose, codeHash(user.id, purpose, value), CODE_MINUTES],
  );
  await sendCode(user.email, value, purpose);
}

/** Comprueba y consume un código. Cada código admite pocos intentos. */
async function consumeCode(userId: string, purpose: Purpose, value: string) {
  const rows = await query<{ id: string; code_hash: string; attempts: number }>(
    `SELECT id::text AS id, code_hash, attempts FROM email_codes
      WHERE user_id = $1 AND purpose = $2 AND expires_at > now()
      ORDER BY id DESC LIMIT 1`,
    [userId, purpose],
  );
  const row = rows[0];
  if (!row) throw new AuthError("El código venció. Pide uno nuevo.");
  if (row.attempts >= CODE_ATTEMPTS) {
    await query("DELETE FROM email_codes WHERE id = $1", [row.id]);
    throw new AuthError("Demasiados intentos. Pide un código nuevo.", 429);
  }
  const given = Buffer.from(codeHash(userId, purpose, value));
  const expected = Buffer.from(row.code_hash);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    await query("UPDATE email_codes SET attempts = attempts + 1 WHERE id = $1", [row.id]);
    throw new AuthError("Ese código no es correcto.");
  }
  await query("DELETE FROM email_codes WHERE user_id = $1 AND purpose = $2", [userId, purpose]);
}

/* ——— Altas, entradas y verificación ——— */

/** Altas por conexión: frena la creación masiva de cuentas (y el gasto de correos). */
const SIGNUPS_PER_HOUR = 5;
const SIGNUPS_PER_DAY = 15;

export async function register(input: z.infer<typeof registerInput>, ip: string) {
  if (
    !(await allow(`registro:ip:${ip}`, SIGNUPS_PER_HOUR, 60)) ||
    !(await allow(`registro:ip-dia:${ip}`, SIGNUPS_PER_DAY, 24 * 60))
  ) {
    throw new AuthError("Se crearon demasiadas cuentas desde esta conexión. Intenta más tarde.", 429);
  }
  let row: UserRow;
  try {
    const rows = await query<UserRow>(
      `INSERT INTO users (email, password_hash, name, whatsapp)
       VALUES ($1, $2, $3, $4) RETURNING ${USER_COLUMNS}`,
      [input.email, await hashPassword(input.password), input.name, input.whatsapp || null],
    );
    row = rows[0];
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AuthError("Ya existe una cuenta con ese correo. Entra con tu contraseña.", 409);
    }
    throw error;
  }
  await startSession(row.id);
  // Si el correo falla, la cuenta existe igual: se puede pedir el código otra vez.
  const mailError = await issueCode(row, "verificar").then(
    () => null,
    (error: unknown) => (error instanceof Error ? error.message : "No se pudo enviar el código."),
  );
  return { user: toUser(row), mailError };
}

/**
 * Límites de entrada:
 * - por correo y conexión (8 en 15 min): quien adivina contraseñas desde una conexión
 *   se frena, pero no puede bloquearle la entrada al dueño, que entra desde otra;
 * - por conexión (30 en 15 min, sin importar el correo): frena a quien prueba muchas cuentas;
 * - por correo desde todas las conexiones (40 por hora): frena ataques repartidos.
 */
export async function login(input: z.infer<typeof loginInput>, ip: string) {
  const key = `entrar:${input.email}:${ip}`;
  if (!(await allow(`entrar:ip:${ip}`, 30, 15))) {
    throw new AuthError("Demasiados intentos desde esta conexión. Espera 15 minutos.", 429);
  }
  if (!(await allow(key, 8, 15)) || !(await allow(`entrar:correo:${input.email}`, 40, 60))) {
    throw new AuthError("Demasiados intentos. Espera 15 minutos o cambia tu contraseña.", 429);
  }
  const rows = await query<UserRow & { password_hash: string }>(
    `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE email = $1`,
    [input.email],
  );
  const row = rows[0];
  const ok = await verifyPassword(input.password, row?.password_hash ?? (await dummyHash()));
  if (!row || !ok) throw new AuthError("Correo o contraseña incorrectos.", 401);
  await forget(key);
  await forget(`entrar:correo:${input.email}`);
  await startSession(row.id);
  return toUser(row);
}

export async function resendVerification(user: User) {
  if (user.verified) return;
  await issueCode(user, "verificar");
}

export async function verifyEmail(user: User, value: string) {
  if (user.verified) return user;
  await consumeCode(user.id, "verificar", value);
  const rows = await query<UserRow>(
    `UPDATE users SET email_verified_at = now() WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [user.id],
  );
  return toUser(rows[0]);
}

/** Siempre responde igual, exista o no la cuenta, para no revelar quién está registrado. */
export async function forgotPassword(address: string, ip?: string) {
  // Pedir códigos manda correos: también se limita por conexión.
  if (ip && !(await allow(`olvido:ip:${ip}`, 10, 60))) return;
  const rows = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [address]);
  if (!rows[0]) return;
  await issueCode(rows[0], "restablecer").catch((error) => {
    // Un límite alcanzado o un fallo del proveedor no se le cuentan a quien pregunta.
    console.error("forgotPassword", error instanceof Error ? error.message : error);
  });
}

export async function resetPassword(input: z.infer<typeof resetInput>) {
  if (!(await allow(`restablecer:${input.email}`, 10, 60))) {
    throw new AuthError("Demasiados intentos. Espera un rato.", 429);
  }
  const rows = await query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [
    input.email,
  ]);
  const row = rows[0];
  if (!row) throw new AuthError("Ese código no es correcto.");
  await consumeCode(row.id, "restablecer", input.code);
  // Recibir el código prueba que el correo es suyo: queda verificado y se cierran las otras sesiones.
  const updated = await query<UserRow>(
    `UPDATE users SET password_hash = $2, email_verified_at = COALESCE(email_verified_at, now())
      WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [row.id, await hashPassword(input.password)],
  );
  await query("DELETE FROM sessions WHERE user_id = $1", [row.id]);
  await forget(`entrar:correo:${input.email}`);
  await startSession(row.id);
  return toUser(updated[0]);
}

export async function updateProfile(userId: string, input: z.infer<typeof profileInput>) {
  const rows = await query<UserRow>(
    `UPDATE users SET name = $2, whatsapp = $3, email_notices = COALESCE($4, email_notices)
      WHERE id = $1 RETURNING ${USER_COLUMNS}`,
    [userId, input.name, input.whatsapp || null, input.notices ?? null],
  );
  return rows[0] ? toUser(rows[0]) : null;
}
