import { CONDITIONS } from "@/data/conditions";
import type { ConditionKey, FixStep } from "@/data/types";

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
const SEXUAL = ["sexo", "sexual", "porno", "desnud*", "prostitu*", "escort", "erotic*", "onlyfans"];

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

/** Señales en un texto (las que no dependen de en qué campo está escrito). */
function textReasons(raw: string): string[] {
  const text = normalize(raw);
  const reasons: string[] = [];

  const bad = hasTerm(text, PROFANITY);
  if (bad) reasons.push(`Lenguaje ofensivo («${bad}»)`);
  const sex = hasTerm(text, SEXUAL);
  if (sex) reasons.push(`Contenido sexual («${sex}»)`);
  // «xxx» se mira aparte: normalize junta letras repetidas (putaaa→puta), así que
  // «xxx» se volvería «x» y marcaría cualquier «x» suelta (x mes, 10 x 8, x estrenar).
  else if (/(^|[^a-z0-9])x{3,}([^a-z0-9]|$)/i.test(raw.normalize("NFD").replace(/\p{Diacritic}/gu, ""))) {
    reasons.push("Contenido sexual («xxx»)");
  }
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
  return reasons;
}

/** Gritos: título casi todo en mayúsculas. */
function shouting(title: string) {
  const letters = title.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ]/g, "");
  return letters.length >= 12 && letters === letters.toUpperCase();
}

/** Precios fuera de lo razonable para un alquiler mensual en El Salvador. */
const oddPrice = (month?: number | null) => month != null && (month < 25 || month > 25000);

export function reviewListing(input: {
  title: string;
  text: unknown;
  priceMonth?: number | null;
}): Review {
  const reasons = textReasons(`${input.title} \n ${collect(input.text).join(" \n ")}`);
  if (shouting(input.title)) reasons.push("Título en mayúsculas");
  if (oddPrice(input.priceMonth)) reasons.push(`Precio mensual poco creíble ($${input.priceMonth})`);
  return { ok: reasons.length === 0, reasons };
}

/** Un motivo de revisión con el paso y el campo exactos donde se corrige. */
export type Issue = { reason: string; step: FixStep; field: string; where: string };

type Written = {
  title?: string;
  colonia?: string;
  description?: string;
  floors?: {
    id: string;
    name: string;
    rooms: { id: string; name: string; note?: string; features?: string[]; view?: { label: string } }[];
  }[];
  conditions?: { key: string; value: string; detail?: string }[];
  rules?: string[];
  includes?: { label: string; note?: string }[];
  prices?: { mes?: number };
};

/**
 * Dónde está cada motivo de revisión, campo por campo, para llevar a quien publica
 * justo al campo que tiene que corregir. Usa las mismas reglas que reviewListing.
 */
export function locateIssues(data: Written): Issue[] {
  const parts: (Omit<Issue, "reason"> & { text: string })[] = [];
  const part = (step: FixStep, field: string, where: string, text: string | undefined) => {
    if (text?.trim()) parts.push({ step, field, where, text });
  };

  part("datos", "titulo", "el título", data.title);
  part("datos", "colonia", "la colonia", data.colonia);
  part("datos", "descripcion", "la descripción", data.description);
  for (const f of data.floors ?? []) {
    part("plano", "plano", `el nombre de «${f.name}»`, f.name);
    for (const r of f.rooms) {
      const text = [r.name, r.note, ...(r.features ?? []), r.view?.label].filter(Boolean).join(" \n ");
      part("plano", `espacio-${r.id}`, `el espacio «${r.name}»`, text);
    }
  }
  for (const c of data.conditions ?? []) {
    const label = CONDITIONS[c.key as ConditionKey]?.label ?? "una condición";
    part("condiciones", `condicion-${c.key}`, `la condición «${label}»`, `${c.value} \n ${c.detail ?? ""}`);
  }
  part("condiciones", "reglas", "las reglas", data.rules?.join(" \n "));
  part("precios", "incluye", "lo que incluye el precio", data.includes?.map((i) => `${i.label} ${i.note ?? ""}`).join(" \n "));

  // Un renglón por campo: si el mismo campo tiene dos motivos, van juntos.
  const issues: Issue[] = [];
  const add = (issue: Issue) => {
    const same = issues.find((i) => i.field === issue.field);
    if (!same) issues.push(issue);
    else if (!same.reason.split(" · ").includes(issue.reason)) same.reason += ` · ${issue.reason}`;
  };
  for (const { text, ...at } of parts) for (const reason of textReasons(text)) add({ reason, ...at });
  if (data.title && shouting(data.title)) add({ reason: "Título en mayúsculas", step: "datos", field: "titulo", where: "el título" });
  if (oddPrice(data.prices?.mes)) {
    add({ reason: `Precio mensual poco creíble ($${data.prices?.mes})`, step: "precios", field: "precio-mes", where: "el precio por mes" });
  }
  return issues;
}
