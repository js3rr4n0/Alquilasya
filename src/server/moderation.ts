/**
 * Revisión automática de anuncios. Lo limpio se publica al instante; si algo
 * suena mal, el anuncio queda «en revisión» con el motivo, para que el admin
 * decida. Prefiere dejar pasar algo dudoso a frenar anuncios normales: por eso
 * solo marca señales claras.
 */

/** Minúsculas, sin tildes, sin trucos tipo «p3nd3j0» ni letras repetidas («putaaa»). */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[0134578@$]/g, (c) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s" })[c]!)
    .replace(/[^a-z\s]/g, " ")
    .replace(/([a-z])\1+/g, "$1")
    .replace(/\s+/g, " ")
    // «p u t a» → «puta»: letras sueltas seguidas se juntan.
    .replace(/(?:\b[a-z] ){2,}[a-z]\b/g, (m) => m.replace(/ /g, ""))
    .trim();
}

// Palabras completas; las que terminan en «*» se buscan como inicio de palabra.
// Groserías e insultos, incluido el uso salvadoreño.
const PROFANITY = [
  "puta", "puto", "putas", "putos", "hijueputa", "hijoeputa", "hdp", "mierda", "verga", "vergon", "pija", "cerote",
  "culero", "culera", "pendejo", "pendeja", "cabron", "cabrona", "malparido", "malparida", "maricon", "marica",
  "joto", "playo", "zorra", "cagada", "cagar", "chingar", "chingada", "chinga", "cono de tu",
  "pucha madre", "tu madre", "idiota", "imbecil", "estupido", "estupida", "retrasado", "subnormal",
];

// Contenido sexual o servicios que no son alquiler de vivienda.
const SEXUAL = ["sexo", "sexual", "porno", "xxx", "desnud*", "prostitu*", "escort", "erotic*", "onlyfans"];

// Discriminación: excluir personas por raza, religión, orientación o nacionalidad
// («no se aceptan extranjeros», «prohibido gays», «solo blancos»…).
const GROUPS =
  "extranjer\\w*|gays?|homosexual\\w*|lesbianas?|trans|negr[oa]s?|morenos?|indi[oa]s?|indigenas?|evangelic\\w*|catolic\\w*|cristian[oa]s?|nicaraguens\\w*|nicas?|hondureñ\\w*|honduren\\w*|catrachos?|guatemaltec\\w*|venezolan\\w*";
const DISCRIMINATION = new RegExp(
  `(^|\\s)((no|ni|prohibid[oa]s?)(\\s\\w+){0,3}\\s(${GROUPS})|solo (blanc[oa]s?|salvadoreñ\\w*|salvadoren\\w*|catolic\\w*|evangelic\\w*|cristian[oa]s?))(\\s|$)`,
);

// Señales típicas de estafa en alquileres.
const SCAM = [
  "deposita antes", "depositar antes de ver", "pago por adelantado sin ver", "envia el dinero", "transferencia antes de ver",
  "western union", "moneygram", "estoy fuera del pais", "estoy en el extranjero y", "gift card", "tarjeta de regalo",
  "bitcoin primero", "pagar para ver", "reserva sin visitar",
];

// Drogas o armas.
const ILLEGAL = ["marihuana", "cocaina", "drogas", "armas de fuego", "venta de armas"];

const hasTerm = (text: string, terms: string[]) =>
  terms.find((t) => {
    const prefix = t.endsWith("*");
    return new RegExp(`(^|\\s)${normalize(t.replace(/\*$/, ""))}${prefix ? "" : "(\\s|$)"}`).test(text);
  })?.replace(/\*$/, "");

/** Todo el texto que escribió la persona, sin enlaces de fotos. */
function collect(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    if (!/^https?:\/\//i.test(value)) out.push(value);
  } else if (Array.isArray(value)) value.forEach((v) => collect(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => collect(v, out));
  return out;
}

export type Review = { ok: boolean; reasons: string[] };

export function reviewListing(input: {
  title: string;
  text: unknown;
  priceMonth?: number | null;
}): Review {
  const raw = collect(input.text).join(" \n ");
  const text = normalize(`${input.title} ${raw}`);
  const reasons: string[] = [];

  const bad = hasTerm(text, PROFANITY);
  if (bad) reasons.push(`Lenguaje ofensivo («${bad}»)`);
  const sex = hasTerm(text, SEXUAL);
  if (sex) reasons.push(`Contenido sexual («${sex}»)`);
  const disc = text.match(DISCRIMINATION);
  if (disc) reasons.push(`Posible discriminación («${disc[2]}»)`);
  const scam = hasTerm(text, SCAM);
  if (scam) reasons.push(`Señal de estafa («${scam}»)`);
  const illegal = hasTerm(text, ILLEGAL);
  if (illegal) reasons.push(`Contenido ilegal («${illegal}»)`);

  // Contacto fuera del sitio: enlaces, correos o teléfonos escritos en el texto.
  if (/(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|sv)\b)/.test(raw)) reasons.push("Tiene enlaces a otros sitios");
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(raw)) reasons.push("Tiene un correo escrito en el texto");
  if (/(\+?503[\s-]?)?\b[267]\d{3}[\s-]?\d{4}\b/.test(raw)) reasons.push("Tiene un teléfono escrito en el texto");

  // Gritos: título casi todo en mayúsculas.
  const letters = input.title.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  if (letters.length >= 12 && letters === letters.toUpperCase()) reasons.push("Título en mayúsculas");

  // Precios fuera de lo razonable para un alquiler mensual en El Salvador.
  if (input.priceMonth != null && (input.priceMonth < 25 || input.priceMonth > 25000)) {
    reasons.push(`Precio mensual poco creíble ($${input.priceMonth})`);
  }

  return { ok: reasons.length === 0, reasons };
}
