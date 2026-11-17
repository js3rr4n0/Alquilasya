import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { currentUser } from "@/server/auth";
import { blobConfigured } from "@/server/blob";
import { rateLimited, tooMany } from "@/server/http";
import { allow } from "@/server/throttle";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 4 * 1024 * 1024;
/** Fotos por cuenta y por día: suficiente para varios anuncios completos. */
const DAILY_PER_ACCOUNT = 300;

/** Comprueba por el contenido, no por lo que diga el navegador, que sea una imagen. */
function looksLikeImage(bytes: Uint8Array, type: string) {
  const at = (i: number, ...v: number[]) => v.every((x, k) => bytes[i + k] === x);
  if (type === "image/jpeg") return at(0, 0xff, 0xd8, 0xff);
  if (type === "image/png") return at(0, 0x89, 0x50, 0x4e, 0x47);
  if (type === "image/webp") return at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50);
  return false;
}

/**
 * Sube una foto a Vercel Blob. Solo cuentas con el correo confirmado, con un
 * máximo diario por cuenta. Si el almacén no está conectado, responde 501.
 */
export async function POST(request: Request) {
  if (rateLimited(request, "upload", 40)) return tooMany();
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Inicia sesión para subir fotos." }, { status: 401 });
  if (!user.verified) {
    return NextResponse.json({ error: "Confirma tu correo para subir fotos." }, { status: 403 });
  }
  if (!blobConfigured()) {
    return NextResponse.json(
      { error: "El almacenamiento de fotos aún no está conectado." },
      { status: 501 },
    );
  }

  let file: FormDataEntryValue | null = null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    /* cae en la validación de abajo */
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta la foto." }, { status: 400 });
  }
  const ext = TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Usa una foto JPG, PNG o WebP." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La foto pesa más de 4 MB." }, { status: 413 });
  }
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!looksLikeImage(head, file.type)) {
    return NextResponse.json({ error: "Ese archivo no es una foto válida." }, { status: 415 });
  }
  if (!(await allow(`fotos:${user.id}`, DAILY_PER_ACCOUNT, 24 * 60))) {
    return NextResponse.json(
      { error: "Llegaste al máximo de fotos por hoy. Intenta mañana." },
      { status: 429 },
    );
  }

  try {
    const blob = await put(`anuncios/${user.id}/foto.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (error) {
    console.error("POST /api/upload", error);
    return NextResponse.json({ error: "No se pudo subir la foto." }, { status: 500 });
  }
}
