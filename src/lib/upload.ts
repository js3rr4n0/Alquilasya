"use client";

/** Reduce una foto a un JPEG razonable antes de subirla (lado mayor ≤ 1800 px). */
async function compress(file: File, max = 1800, quality = 0.84): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo leer la foto"))), "image/jpeg", quality),
  );
}

/**
 * Sube una foto y devuelve su URL pública. Lanza un error con un mensaje
 * que se puede mostrar tal cual a quien publica.
 */
export async function uploadPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Ese archivo no es una foto.");
  let blob: Blob;
  try {
    blob = await compress(file);
  } catch {
    throw new Error("No pudimos leer esa foto. Prueba con un JPG o PNG.");
  }
  const form = new FormData();
  form.append("file", new File([blob], "foto.jpg", { type: "image/jpeg" }));
  const res = await fetch("/api/upload", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(
      res.status === 501
        ? "Subir fotos propias aún no está disponible. Usa una foto de muestra por ahora."
        : (data.error ?? "No se pudo subir la foto."),
    );
  }
  return data.url;
}
