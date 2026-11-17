import type { Condition, ConditionKey, Listing } from "../data/types";
import { money } from "./format";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

function sentence(c: Condition) {
  return c.detail ? `${c.value}. ${c.detail}` : `${c.value}.`;
}

function byStatus(c: Condition | undefined, yes: string, partial: string, no: string) {
  if (!c) return "Déjame revisarlo y te confirmo por aquí.";
  if (c.status === "si") return `${yes} ${sentence(c)}`;
  if (c.status === "parcial") return `${partial} ${sentence(c)}`;
  return `${no} ${c.detail ?? "Así está en las condiciones del anuncio."}`;
}

const TOPICS: {
  test: RegExp;
  key?: ConditionKey;
  answer: (l: Listing, c?: Condition) => string;
}[] = [
  {
    test: /(perr|gat|mascota|labrador|cachorr)/,
    key: "mascotas",
    answer: (_l, c) =>
      byStatus(
        c,
        "Sí, sin problema.",
        "Depende del caso:",
        "Te soy sincero: no se aceptan mascotas.",
      ),
  },
  {
    test: /(invitad|dormir|pernoct|amig|familia|novi|pareja|se queden)/,
    key: "invitados",
    answer: (_l, c) =>
      byStatus(c, "Claro que sí.", "Sí, con un límite:", "Prefiero no tener invitados a dormir."),
  },
  {
    test: /(fum|cigarr|vape|tabaco)/,
    key: "fumar",
    answer: (_l, c) => byStatus(c, "Sí.", "Solo en un lugar:", "No se puede fumar."),
  },
  {
    test: /(trabaj|oficina|negocio|cliente|empresa|remoto|emprend|tienda|taller)/,
    key: "negocio",
    answer: (_l, c) =>
      byStatus(c, "Sí, se puede.", "Para trabajar sí, con un matiz:", "Es solo para vivienda."),
  },
  {
    test: /(fiesta|evento|reunion|cumple|musica|celebra|parrillada)/,
    key: "eventos",
    answer: (_l, c) => byStatus(c, "Sí.", "Reuniones sí, con límite:", "Fiestas no."),
  },
  {
    test: /(nin|hij|bebe|chiquit)/,
    key: "ninos",
    answer: (_l, c) =>
      byStatus(
        c,
        "Sí, es buena casa para niños.",
        "Sí, pero ojo:",
        "No es el lugar ideal para niños.",
      ),
  },
  {
    test: /(carro|auto|parque|parqueo|estacion|cochera|garaje|moto)/,
    key: "estacionamiento",
    answer: (_l, c) => byStatus(c, "Sí:", "Más o menos:", "No hay estacionamiento."),
  },
  {
    test: /(escaler|silla de ruedas|accesib|escalon|ascensor|elevador|abuel|movilidad)/,
    key: "accesibilidad",
    answer: (_l, c) => byStatus(c, "Sí, sin problema.", "En parte:", "Te aviso con honestidad:"),
  },
  {
    test: /(subarr|airbnb|realquil)/,
    key: "subarriendo",
    answer: (_l, c) => byStatus(c, "Sí.", "Con permiso:", "No se puede subarrendar."),
  },
];

/** A plausible owner answer built from the listing's own written conditions. */
export function replyFor(listing: Listing, text: string): string {
  const t = norm(text);

  if (/(deposit|garantia|fianza)/.test(t)) {
    return `El depósito es de ${money(listing.deposit)} y se devuelve al terminar. Con expediente verificado lo podemos dividir en dos pagos.`;
  }
  if (/(descuento|negoci|rebaja|bajar el precio)/.test(t)) {
    const year = listing.prices.anio;
    return year
      ? `Con contrato de un año ya baja a ${money(year)} al mes. Más que eso no puedo, pero el total no cambia nunca.`
      : "El precio ya es el total, sin comisiones. Para estancias largas lo podemos conversar.";
  }
  if (/(quincen|en partes|cuotas|dos pagos)/.test(t)) {
    return "Sí, se puede pagar en dos partes, el 1 y el 15 de cada mes, desde la misma app.";
  }
  if (/(precio|total|incluye|internet|luz|agua|servicio|recibo|cobro)/.test(t)) {
    const yes = listing.includes
      .filter((i) => i.included)
      .map((i) =>
        i.note ? `${i.label.toLowerCase()} (${i.note.toLowerCase()})` : i.label.toLowerCase(),
      );
    const no = listing.includes.filter((i) => !i.included);
    const extra = no.length
      ? ` Aparte: ${no.map((i) => `${i.label.toLowerCase()}${i.note ? `, ${i.note.toLowerCase()}` : ""}`).join("; ")}.`
      : " No hay nada aparte.";
    return `El total incluye ${yes.join(", ")}.${extra}`;
  }
  if (/(visitar|ver la casa|conocer|cita|pasar a ver|recorrido)/.test(t)) {
    return "Claro. ¿Te funciona el sábado a las 10:00? Te mando la ubicación exacta por aquí, que es privado.";
  }

  for (const topic of TOPICS) {
    if (topic.test.test(t)) {
      const cond = topic.key ? listing.conditions.find((c) => c.key === topic.key) : undefined;
      return topic.answer(listing, cond);
    }
  }

  return "Buena pregunta. Te respondo con calma en un momento; mientras, en la ficha están todas las condiciones por escrito.";
}

export const SUGGESTED_QUESTIONS = [
  "¿Aceptan perros grandes?",
  "¿Pueden quedarse visitas a dormir?",
  "¿Puedo trabajar desde casa?",
  "¿El total incluye internet y luz?",
  "¿Se puede pagar por quincena?",
  "¿Puedo pasar a verla el sábado?",
];
