import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ButtonLink, Container } from "@/components/ui";
import { abs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Publica tu casa o apartamento en alquiler gratis en El Salvador",
  description:
    "Anuncia tu inmueble en alquiler gratis y sin comisión. Formulario guiado con plano, fotos, precio total y condiciones. Recibe mensajes solo de personas a las que les sirve.",
  alternates: { canonical: "/anunciar" },
};

const STEPS = [
  ["Crea tu cuenta", "Con tu correo. Confirmas con un código y listo."],
  ["Llena el formulario guiado", "Datos, plano con medidas, fotos, las once condiciones, plazos y precios."],
  ["Marca la ubicación", "Eliges departamento y distrito y pones el punto en el mapa."],
  ["Sale al público al instante", "Un filtro automático lo revisa en segundos. Después puedes editarlo, pausarlo o borrarlo cuando quieras."],
];

const WHY = [
  ["Gratis, siempre", "No pagas por publicar ni comisión por alquilar. El pago lo acuerdas directamente con tu inquilino."],
  ["Menos preguntas repetidas", "El anuncio ya dice el precio total, el depósito, lo que incluye y las reglas. Te escribe quien ya lo leyó."],
  ["Tú controlas tu contacto", "Tu WhatsApp no aparece en el anuncio ni se comparte. Te escriben personas con cuenta, por el chat privado del sitio."],
  ["Plazos a tu medida", "Alquila por día, semana, mes, seis meses o un año, cada uno con su precio."],
];

const FAQ = [
  ["¿Cuánto cuesta publicar?", "Nada. Publicar en AlquilasYa es gratis y no se cobra comisión por alquilar."],
  ["¿Qué necesito para publicar?", "Una cuenta con tu correo confirmado, los datos del inmueble, el precio por cada plazo que aceptes, el depósito y tus condiciones. Las fotos propias son recomendables."],
  ["¿Cuánto tarda en aparecer mi anuncio?", "Nada: se publica al instante. Un filtro automático revisa que no tenga groserías, datos de contacto en el texto ni señales de estafa. Si encuentra algo, queda «En revisión» y en tu cuenta te decimos qué corregir."],
  ["¿Puedo cambiarlo después?", "Sí. Desde tu cuenta puedes editar, pausar, reactivar o borrar tu anuncio."],
  ["¿Quién cobra la renta?", "Tú. AlquilasYa no recibe ni guarda dinero: solo publica el anuncio y te pone en contacto con quien busca."],
];

/** Aterrizaje para propietarios: destino de las campañas «publicar casa en alquiler gratis». */
export default function Page() {
  return (
    <div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ.map(([q, a]) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
          })),
          url: abs("/anunciar"),
        }}
      />

      <section className="on-dark dots bg-negro pb-14 pt-10 text-crema-100 lg:pb-20">
        <Container>
          <p className="label text-terracota-300">Para propietarios</p>
          <h1 className="serif mt-4 max-w-[17ch] text-balance text-[46px] leading-[0.97] sm:text-[72px]">
            Publica tu alquiler <em className="text-terracota-300">gratis.</em>
          </h1>
          <p className="mt-5 max-w-[56ch] text-[18px] leading-relaxed text-piedra-300">
            Anuncia tu casa o apartamento en El Salvador sin pagar y sin comisión. Dices todo desde
            el inicio y te escribe quien de verdad puede alquilarlo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/publicar" variant="cream" size="lg">
              Publicar ahora
            </ButtonLink>
            <ButtonLink to="/guias/como-publicar-un-buen-anuncio-de-alquiler" variant="outlineLight" size="lg">
              Cómo hacer un buen anuncio
            </ButtonLink>
          </div>
        </Container>
      </section>

      <Container className="py-16 lg:py-24">
        <h2 className="head text-[32px] sm:text-[40px]">Por qué aquí.</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {WHY.map(([title, text]) => (
            <li key={title} className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8">
              <h3 className="head text-[24px]">{title}.</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-grafito-700">{text}</p>
            </li>
          ))}
        </ul>

        <h2 className="head mt-20 text-[32px] sm:text-[40px]">Cómo se publica.</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title} className="border-t-2 border-negro pt-5">
              <span className="mono text-[14px] font-medium text-terracota-700">0{i + 1}</span>
              <h3 className="mt-2 text-[19px] font-semibold leading-snug">{title}</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">{text}</p>
            </li>
          ))}
        </ol>

        <h2 className="head mt-20 text-[32px] sm:text-[40px]">Preguntas frecuentes.</h2>
        <dl className="mt-6 max-w-[820px] divide-y divide-piedra-250/80 border-y border-piedra-250/80">
          {FAQ.map(([q, a]) => (
            <div key={q} className="py-5">
              <dt className="text-[18px] font-semibold text-negro">{q}</dt>
              <dd className="mt-2 text-[16px] leading-relaxed text-grafito-700">{a}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-14">
          <ButtonLink to="/publicar" variant="primary" size="lg">
            Publicar mi alquiler gratis
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
