/**
 * Resumen corto del anuncio (lo que se ve bajo el título, en Google y al compartir).
 * Ya no se pide aparte: sale de la primera frase de la descripción o, si no hay,
 * de los datos del inmueble.
 */
export function summaryFrom(description: string, facts: string) {
  const first = description
    .split("\n")
    .map((l) => l.trim())
    // Las líneas que quedaron solo con el tema («Agua:») no sirven de resumen.
    .find((l) => l.replace(/^[^:]{1,40}:\s*/, "").length >= 12);
  if (first) {
    const sentence = first.match(/^.{12,}?[.!?](\s|$)/)?.[0]?.trim() ?? first;
    return sentence.length > 200 ? `${sentence.slice(0, 197).trimEnd()}…` : sentence;
  }
  return facts.slice(0, 200);
}
