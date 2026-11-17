"use client";

import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router";
import { SYMBOL_ARMS } from "../brand/logo-paths";
import { ConditionsLegend, ConditionsSheet } from "../components/ConditionsSheet";
import { DurationPicker } from "../components/DurationPicker";
import { FloorPlan, PlanExplorer } from "../components/FloorPlan";
import { ListingCard, roomsLabel } from "../components/ListingCard";
import { SearchBar } from "../components/SearchBar";
import { Badge, ButtonLink, Container, Eyebrow, Folio, SectionTitle } from "../components/ui";
import { DURATIONS, priceSuffix, type DurationKey } from "../lib/durations";
import { cx, m2, money } from "../lib/format";
import { departments } from "../lib/geo";
import { FAQ } from "../lib/site";
import { photoSrcSet, photoUrl } from "../lib/photos";
import { useStore } from "../lib/store";

const EXAMPLES: Record<DurationKey, { id: string; why: string }> = {
  dia: { id: "cabana-ataco", why: "Una noche en la montaña, con leña y café incluidos." },
  semana: { id: "cabana-coatepeque", why: "Siete días frente al lago, con muelle y dos kayaks." },
  mes: {
    id: "apartamento-las-palmas",
    why: "Un mes con agua, luz e internet ya dentro del total.",
  },
  seis: { id: "casa-colonial-suchitoto", why: "Medio año con taller propio hacia la calle." },
  anio: { id: "casa-los-naranjos", why: "Contrato anual a precio reducido, directo con el dueño." },
};

export function Home() {
  const { listings, examples, loaded, duration, setDuration } = useStore();
  // Las piezas que explican el producto usan casas de ejemplo; los resultados, solo anuncios reales.
  const naranjos = examples.find((l) => l.id === "casa-los-naranjos") ?? examples[0];
  const palmas = examples.find((l) => l.id === "apartamento-las-palmas") ?? examples[1];
  const featured = listings.slice(0, 4);

  return (
    <div>
      {/* ——— 01 · EL UMBRAL ——— */}
      <section aria-labelledby="hero-title" className="overflow-hidden">
        <div className="on-dark dots relative bg-negro text-crema-100">
          <Container className="pt-8 lg:pt-10">
            <Folio left="Alquileres en El Salvador" right="Publicar es gratis" tone="dark" />
            <div className="mt-10 grid items-end gap-8 lg:mt-14 lg:grid-cols-[1fr_380px] lg:gap-12 xl:grid-cols-[1fr_440px]">
              <div className="min-w-0 pb-4 lg:pb-16">
                <h1
                  id="hero-title"
                  className="serif text-balance text-[48px] leading-[0.95] sm:text-[72px] lg:text-[88px]"
                >
                  Todo claro <em className="text-terracota-300">antes</em> de entrar.
                </h1>
                <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-piedra-300">
                  Cada anuncio dice el precio total, el depósito, el plano de la casa y las once
                  condiciones del alquiler antes de que le escribas a nadie.
                </p>
                <SearchBar className="mt-7 max-w-[660px]" />
              </div>

              {/* Upper half of the Y Umbral: arms rest flush on the threshold edge. */}
              <div
                aria-hidden
                className="pointer-events-none ml-auto hidden w-full sm:block sm:max-w-[320px] lg:max-w-none"
              >
                <svg viewBox="0 0 110 65" className="block h-auto w-full">
                  <path d={SYMBOL_ARMS} fill="#F5F2EB" />
                </svg>
              </div>
            </div>
          </Container>
        </div>

        <div className="border-b border-piedra-250/80 bg-crema-100">
          <Container className="pb-10 lg:pb-12">
            <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px] lg:gap-12 xl:grid-cols-[1fr_440px]">
              <dl className="order-2 grid gap-x-10 gap-y-7 pt-8 sm:grid-cols-2 lg:order-1 lg:pt-10">
                {[
                  ["Precio", "El total, no un «desde»", "Renta y servicios incluidos, y cuánto hace falta el primer día."],
                  ["Comisión", "$0 para quien busca y quien publica", "No cobramos por alquilar ni por publicar."],
                  ["Duración", "De 1 día a 1 año", "Cada propietario dice qué plazos acepta y a qué precio."],
                  ["El plano", "Cuarto por cuarto, con fotos", "Metros reales de cada espacio, también de la terraza."],
                ].map(([k, v, d]) => (
                  <div key={k}>
                    <dt className="text-[14px] font-medium text-terracota-700">{k}</dt>
                    <dd className="mt-1 text-[19px] font-semibold leading-snug tracking-[-0.015em] text-negro">
                      {v}
                    </dd>
                    <dd className="mt-1 max-w-[38ch] text-[15px] leading-snug text-grafito-600">{d}</dd>
                  </div>
                ))}
              </dl>

              {/* Lower half of the Y Umbral: 1-module cut + terracotta pillar + caption to its right. */}
              <div className="order-1 ml-auto hidden w-full grid-cols-[36.93%_26.14%_36.93%] items-start sm:grid sm:max-w-[320px] lg:order-2 lg:max-w-none">
                <div aria-hidden />
                <svg viewBox="40.62 0 28.76 42" className="block h-auto w-full" aria-hidden>
                  <rect
                    x="40.62"
                    y="10"
                    width="28.76"
                    height="32"
                    fill="#D4541A"
                    className="animate-pillar"
                  />
                </svg>
                <div className="pl-3.5 pt-[24.6%] sm:pl-5">
                  <p className="text-[14px] font-medium text-terracota-700">Lo que es cierto</p>
                  <p className="mt-1 text-[15px] font-semibold leading-snug text-negro">
                    Lo escrito en el anuncio es lo que vale.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </div>
      </section>

      {/* ——— 02 · CASAS CON TODO ESCRITO ——— */}
      <section
        aria-labelledby="casas-title"
        className="border-b border-piedra-250/80 py-20 lg:py-28"
      >
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionTitle
              index="01"
              kicker="Alquileres"
              title={featured.length ? "Recién publicados." : "Los primeros anuncios están por llegar."}
              lead={
                featured.length
                  ? "Cambia la duración y mira el total para ese plazo."
                  : "AlquilasYa está empezando en El Salvador. Publica tu inmueble gratis o déjanos tu correo y te avisamos cuando haya opciones en tu zona."
              }
            />
            {featured.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <DurationPicker value={duration} onChange={setDuration} compact />
                <ButtonLink to="/explorar" variant="outline" size="md">
                  Ver todos <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            ) : (
              loaded && (
                <div className="flex flex-wrap items-center gap-3">
                  <ButtonLink to="/publicar" variant="primary" size="md">
                    Publicar gratis <ArrowRight className="size-4" />
                  </ButtonLink>
                  <ButtonLink to="/lista" variant="outline" size="md">
                    Avísenme
                  </ButtonLink>
                </div>
              )
            )}
          </div>

          {featured.length > 0 && (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((l, i) => (
                <ListingCard key={l.id} listing={l} duration={duration} priority={i < 2} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ——— 03 · LO QUE NOS DIFERENCIA ——— */}
      <section
        aria-labelledby="certeza-title"
        className="border-b border-piedra-250/80 py-20 lg:py-28"
      >
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="lg:sticky lg:top-24">
              <Eyebrow index="02">Las condiciones, por escrito</Eyebrow>
              <h2
                id="certeza-title"
                className="serif mt-4 text-balance text-[40px] leading-[1.02] sm:text-[52px]"
              >
                Arriba, lo que se ve. Abajo,{" "}
                <em className="text-terracota-700">lo que es cierto.</em>
              </h2>
              <p className="mt-4 max-w-[46ch] text-[16px] leading-relaxed text-grafito-700">
                Once condiciones que todo anuncio debe responder: mascotas, invitados, muebles,
                parqueo y más. Toca cualquiera para ver el detalle.
              </p>
              <ConditionsLegend className="mt-6" />
              <div className="mt-6">
                <ButtonLink to={`/casa/${palmas.id}`} variant="ink">
                  Ver la ficha completa <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            </div>

            {/* Specimen card: photo on top, the eleven written conditions below. */}
            <div className="overflow-hidden rounded-card bg-crema-050 ring-1 ring-arena-200">
              <div className="relative aspect-[16/10] bg-arena-200">
                <img
                  src={photoUrl(palmas.cover, 1200, 750)}
                  srcSet={photoSrcSet(palmas.cover, [600, 900, 1200], 0.625)}
                  sizes="(min-width: 1024px) 52vw, 94vw"
                  alt={`${palmas.title} en ${palmas.zone}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
              </div>
              <div className="border-t-2 border-negro p-5 sm:p-7">
                <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5">
                  <div>
                    <p className="leading-none">
                      <span className="text-[28px] font-semibold tabular-nums tracking-[-0.03em]">
                        {money(palmas.prices.mes ?? 395)}
                      </span>{" "}
                      <span className="text-[14px] text-grafito-600">/ mes · total estimado</span>
                    </p>
                    <p className="mt-2 text-[15px] text-grafito-700">
                      {palmas.type} · {roomsLabel(palmas)} · {m2(palmas.area)} · {palmas.zone}
                    </p>
                  </div>
                  <Badge tone="outline">Ejemplo ilustrativo</Badge>
                </div>
                <ConditionsSheet conditions={palmas.conditions} />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ——— 04 · EL PLANO INTERACTIVO ——— */}
      <section
        aria-labelledby="plano-title"
        className="border-b border-piedra-250/80 py-20 lg:py-28"
      >
        <Container>
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <SectionTitle
              index="03"
              kicker="El plano de la casa"
              title="Toca un cuarto y míralo."
              lead="Quien publica arma el plano arrastrando cada espacio con sus metros y sus fotos. Si hay terraza o balcón, también sube la vista. Pruébalo con esta casa de ejemplo."
            />
            <div className="flex flex-wrap gap-3">
              <ButtonLink to={`/casa/${naranjos.id}`} variant="outline">
                Abrir esta casa
              </ButtonLink>
              <ButtonLink to="/publicar?paso=plano" variant="ink">
                Probar el editor de planos <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          </div>

          <PlanExplorer
            floors={naranjos.floors}
            context={naranjos.title}
            initialRoomId={naranjos.floors[0]?.rooms[11]?.id}
            className="mt-12"
          />
        </Container>
      </section>

      {/* ——— 05 · CINCO DURACIONES ——— */}
      <section
        aria-labelledby="plazos-title"
        className="border-b border-piedra-250/80 py-20 lg:py-28"
      >
        <Container>
          <SectionTitle
            index="04"
            kicker="Duración del alquiler"
            title="Un día, una semana, un mes, seis meses o un año."
            lead="No todos buscan lo mismo: hay quien necesita una cabaña por el fin de semana y quien busca casa por un año. Cada propietario elige qué plazos acepta y pone el total para cada uno."
          />

          <div className="mt-12 grid overflow-hidden rounded-card bg-crema-050 ring-1 ring-arena-200 md:grid-cols-5">
            {DURATIONS.map((d, i) => {
              const ex = EXAMPLES[d.key];
              const l = examples.find((x) => x.id === ex.id) ?? examples[0];
              const p = l.prices[d.key] ?? Object.values(l.prices)[0] ?? 0;
              const active = duration === d.key;
              return (
                <div
                  key={d.key}
                  onClick={() => setDuration(d.key)}
                  className={cx(
                    "group flex cursor-pointer flex-col justify-between p-5 transition-colors sm:p-6",
                    i > 0 && "border-t border-arena-200 md:border-l md:border-t-0",
                    active ? "bg-negro text-crema-100" : "hover:bg-arena-200/70",
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={cx(
                          "label",
                          active ? "text-terracota-300" : "text-terracota-700",
                        )}
                      >
                        0{i + 1}
                      </span>
                      <span
                        className={cx("label-sm", active ? "text-piedra-300" : "text-grafito-600")}
                      >
                        {d.contract}
                      </span>
                    </div>
                    <h3 className="head mt-3 text-[28px]">{d.label}.</h3>
                    <p
                      className={cx(
                        "mt-2 text-[14px] leading-snug",
                        active ? "text-piedra-300" : "text-grafito-600",
                      )}
                    >
                      {ex.why}
                    </p>
                  </div>

                  <div
                    className={cx(
                      "mt-6 border-t pt-3.5",
                      active ? "border-crema-100/15" : "border-arena-200",
                    )}
                  >
                    <p className={cx("text-[14px]", active ? "text-piedra-300" : "text-grafito-600")}>
                      Ejemplo · {l.zone}
                    </p>
                    <p className="mt-1 text-[22px] font-semibold tabular-nums tracking-[-0.025em]">
                      {money(p)}{" "}
                      <span
                        className={cx(
                          "text-[14px] font-normal",
                          active ? "text-piedra-300" : "text-grafito-600",
                        )}
                      >
                        {priceSuffix(d.key)}
                      </span>
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[14px] font-medium">
                      <span className={active ? "text-crema-100" : "text-terracota-700"}>
                        {active ? "Seleccionado" : "Elegir"}
                      </span>
                      <Link
                        to={`/casa/${l.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={cx(
                          "inline-flex items-center gap-1",
                          active
                            ? "text-piedra-300 hover:text-crema-100"
                            : "text-grafito-600 hover:text-negro",
                        )}
                      >
                        Ver <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ——— 06 · $0 DE COMISIÓN ——— */}
      <section
        aria-labelledby="modelo-title"
        className="on-dark dots bg-negro py-20 text-crema-100 lg:py-28"
      >
        <Container>
          <Folio left="05 · Cuánto cuesta usar AlquilasYa" right="Publicar es gratis. Siempre." tone="dark" />
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="head text-[96px] leading-[0.88] tracking-tightest sm:text-[132px]">
                $0<span className="text-terracota-300">.</span>
              </p>
              <h2 id="modelo-title" className="head mt-4 text-[30px] sm:text-[38px]">
                Sin comisión ni intermediario.
              </h2>
              <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-piedra-300">
                El trato es directo entre quien alquila y quien busca. Más adelante, quien publique
                podrá pagar para destacar su anuncio; siempre llevará la etiqueta{" "}
                <strong className="font-semibold text-crema-100">Anuncio</strong> y nunca cambiará
                el precio del alquiler.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <ButtonLink to="/publicar" variant="cream">
                  Publicar gratis <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink to="/explorar" variant="outlineLight">
                  Explorar alquileres
                </ButtonLink>
              </div>
            </div>

            <div className="overflow-hidden rounded-card bg-tinta-900 ring-1 ring-crema-100/12">
              <div className="border-b border-crema-100/12 px-5 py-4 sm:px-7">
                <p className="text-[14px] font-medium text-terracota-300">
                  Ejemplo ilustrativo · Casa de $1250 al mes
                </p>
              </div>
              <table className="w-full text-left text-[16px]">
                <caption className="sr-only">Lo que se paga para entrar, en un caso de ejemplo</caption>
                <tbody className="divide-y divide-crema-100/10 tabular-nums">
                  {[
                    ["Primer mes de alquiler", "$1250", false],
                    ["Depósito reembolsable", "$1050", false],
                    ["Comisión de AlquilasYa", "$0", true],
                    ["Cargo por publicar", "$0", true],
                  ].map(([label, value, zero]) => (
                    <tr key={label as string}>
                      <td className="py-4 pl-5 pr-3 text-piedra-300 sm:pl-7">{label}</td>
                      <td
                        className={cx(
                          "py-4 pl-3 pr-5 text-right font-medium sm:pr-7",
                          zero && "font-semibold text-terracota-300",
                        )}
                      >
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-crema-100 bg-crema-100/[0.04] text-[18px] font-semibold tabular-nums">
                    <td className="py-4 pl-5 pr-3 sm:pl-7">Para entrar a vivir</td>
                    <td className="py-4 pl-3 pr-5 text-right sm:pr-7">$2300</td>
                  </tr>
                </tfoot>
              </table>
              <p className="border-t border-crema-100/12 px-5 py-4 text-[14px] leading-snug text-piedra-400 sm:px-7">
                El pago se acuerda directamente con el propietario. AlquilasYa no recibe ni guarda
                dinero.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ——— 07 · CÓMO FUNCIONA ——— */}
      <section
        aria-labelledby="pasos-title"
        className="border-b border-piedra-250/80 py-20 lg:py-28"
      >
        <Container>
          <Eyebrow index="06">Cómo funciona</Eyebrow>
          <h2 id="pasos-title" className="head mt-3 max-w-[18ch] text-balance text-[32px] sm:text-[42px] lg:text-[48px]">
            Primero el dato, después el contacto.
          </h2>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Busca por costo total",
                d: "Elige zona, duración y fecha. Los filtros dicen cuántas opciones dejan, y el precio que ves es el del plazo que elegiste.",
                to: "/explorar",
                cta: "Explorar",
              },
              {
                t: "Lee la ficha completa",
                d: "Plano con fotos de cada espacio, lo que incluye el precio, lo que no, el depósito y las once condiciones.",
                to: `/casa/${naranjos.id}`,
                cta: "Ver una ficha de ejemplo",
              },
              {
                t: "Escribe al propietario",
                d: "Solo entonces dejas tu nombre y tu WhatsApp con tu pregunta. Sin registro y sin intermediarios.",
                to: "/lista",
                cta: "Unirme a la lista de espera",
              },
            ].map((step, i) => (
              <li
                key={step.t}
                className="flex flex-col rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-8"
              >
                <span className="mono text-[14px] font-medium text-terracota-700">0{i + 1}</span>
                <h3 className="head mt-4 text-[26px]">{step.t}.</h3>
                <p className="mt-3 flex-1 text-[16px] leading-relaxed text-grafito-700">{step.d}</p>
                <Link
                  to={step.to}
                  className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-negro underline decoration-piedra-300 underline-offset-4 hover:decoration-negro"
                >
                  {step.cta} <ArrowRight className="size-4" />
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ——— ZONAS Y PREGUNTAS ——— */}
      <section aria-labelledby="zonas-title" className="border-b border-piedra-250/80 py-20 lg:py-28">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <div>
              <Eyebrow index="07">Dónde buscar</Eyebrow>
              <h2 id="zonas-title" className="head mt-3 text-balance text-[32px] sm:text-[40px]">
                Alquileres en los 14 departamentos.
              </h2>
              <ul className="mt-7 flex flex-wrap gap-2">
                {departments.map((d) => (
                  <li key={d.id}>
                    <Link
                      to={`/alquiler/${d.slug}`}
                      className="inline-flex h-10 items-center rounded-ctl bg-crema-050 px-3.5 text-[15px] text-grafito-700 ring-1 ring-piedra-250 hover:text-negro hover:ring-negro"
                    >
                      {d.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Eyebrow index="08">Preguntas frecuentes</Eyebrow>
              <div className="mt-5 divide-y divide-piedra-250/80 border-y border-piedra-250/80">
                {FAQ.map((f) => (
                  <details key={f.q} className="group py-1">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-negro [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span
                        aria-hidden
                        className="text-[22px] font-normal leading-none text-terracota-700 transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="max-w-[64ch] pb-5 text-[16px] leading-relaxed text-grafito-700">
                      {f.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ——— 08 · PUBLICAR ——— */}
      <section aria-labelledby="publicar-title" className="py-20 lg:py-28">
        <Container>
          <div className="grid items-center gap-12 rounded-card bg-arena-200 p-6 ring-1 ring-piedra-250 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
            <div>
              <Eyebrow index="09">Para propietarios</Eyebrow>
              <h2
                id="publicar-title"
                className="serif mt-4 text-balance text-[38px] leading-[1.02] sm:text-[50px]"
              >
                ¿Tienes una casa? <em className="text-terracota-700">Publícala</em> con su plano en
                quince minutos.
              </h2>
              <p className="mt-4 max-w-[48ch] text-[16px] leading-relaxed text-grafito-700">
                Arrastras cada cuarto, pones sus metros, eliges fotos y respondes las once
                condiciones. Publicar es gratis. Revisamos cada anuncio antes de mostrarlo.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink to="/publicar" variant="primary" size="lg">
                  Empezar a publicar <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink to="/publicar?paso=plano" variant="outline" size="lg">
                  Ir directo al editor de planos
                </ButtonLink>
              </div>
            </div>

            <div className="rounded-card bg-crema-050 p-4 ring-1 ring-piedra-250 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[14px] font-medium text-grafito-600">
                  Plano de ejemplo · {palmas.title}
                </span>
                <span className="text-[14px] font-medium tabular-nums text-terracota-700">
                  {m2(palmas.area)}
                </span>
              </div>
              <FloorPlan
                floor={palmas.floors[0]}
                interactive={false}
                label={`Plano de ${palmas.title}`}
              />
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
