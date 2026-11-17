import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { blobConfigured } from "@/server/blob";
import { rateLimited, tooMany } from "@/server/http";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 4 * 1024 * 1024;

/** Sube una foto a Vercel Blob. Si el almacén no está conectado, responde 501. */
export async function POST(request: Request) {
  if (rateLimited(request, "upload", 40)) return tooMany();
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

  try {
    const blob = await put(`anuncios/foto.${ext}`, file, {
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
