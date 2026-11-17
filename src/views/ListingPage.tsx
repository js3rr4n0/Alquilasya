"use client";

import { ArrowLeft, ArrowRight, MessageSquare, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@/lib/router";
import { Calendar, overlapsBooked } from "../components/Calendar";
import { ConditionsLegend, ConditionsSheet } from "../components/ConditionsSheet";
import { ContactDialog } from "../components/ContactDialog";
import { ReportButton } from "../components/ReportDialog";
import { DurationPicker } from "../components/DurationPicker";
import { PlanExplorer } from "../components/FloorPlan";
import { ListingCard, roomsLabel, SaveButton, spaceCount } from "../components/ListingCard";
import {
  Avatar,
  Badge,
  Button,
  ButtonLink,
  Container,
  Eyebrow,
  Folio,
  Modal,
} from "../components/ui";
import type { Listing, ListingSummary } from "../data/types";
import {
  DURATION,
  DURATIONS,
  endDate,
  formatPeriodTotal,
  isShortStay,
  priceSuffix,
  type DurationKey,
} from "../lib/durations";
import { cx, dateShort, dec, fromIsoDay, isoDay, m2, money, plural } from "../lib/format";
import { photoSrcSet, photoUrl } from "../lib/photos";
import { useListing, useStore } from "../lib/store";
import { send } from "../lib/track";

export function ListingPage({ initial }: { initial?: Listing }) {
  const { id } = useParams();
  const { listing, loading } = useListing(id, initial);
  const { duration, setDuration, start, setStart } = useStore();
  const [moreListings, setMoreListings] = useState<ListingSummary[]>([]);
  const seen = listing?.id;
  const seenZone = listing?.zone;
  const seenRegion = listing?.region;
  useEffect(() => {
    if (seen) send("ficha_vista", { props: { anuncio: seen, zona: `${seenZone}, ${seenRegion}` } });
  }, [seen, seenZone, seenRegion]);
  useEffect(() => {
    if (!id) return;
    fetch(`/api/listings?solo=0&limite=3&excluir=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d: { results?: ListingSummary[] }) => setMoreListings(d.results ?? []))
      .catch(() => {});
  }, [id]);
  const [contactOpen, setContactOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const availableDurations = useMemo(
    () => DURATIONS.filter((d) => listing?.prices[d.key] !== undefined).map((d) => d.key),
    [listing],
  );

  useEffect(() => {
    if (listing && !listing.prices[duration] && availableDurations[0]) {
      setDuration(availableDurations[0]);
    }
  }, [listing, duration, availableDurations, setDuration]);

  const allPhotos = useMemo(() => {
    if (!listing) return [];
    const list: { src: string; caption: string }[] = listing.cover
      ? [{ src: listing.cover, caption: `${listing.title} · foto principal` }]
      : [];
    const seen = new Set([listing.cover]);
    for (const f of listing.floors) {
      for (const r of f.rooms) {
        for (const p of r.photos) {
          if (!seen.has(p)) {
            seen.add(p);
            list.push({ src: p, caption: `${r.name} · ${dec(r.w)} × ${dec(r.h)} m` });
          }
        }
        if (r.view?.photo && !seen.has(r.view.photo)) {
          seen.add(r.view.photo);
          list.push({
            src: r.view.photo,
            caption: `Vista desde ${r.name.toLowerCase()} · ${r.view.label}`,
          });
        }
      }
    }
    return list;
  }, [listing]);

  if (!listing && loading) {
    return (
      <Container className="py-24" aria-busy="true">
        <div className="h-[420px] animate-pulse rounded-card bg-arena-200" />
        <div className="mt-8 h-12 w-2/3 animate-pulse rounded-ctl bg-arena-200" />
        <p className="sr-only">Cargando la ficha…</p>
      </Container>
    );
  }

  if (!listing) {
    return (
      <Container className="py-24 text-center">
        <p className="label text-terracota-700">No encontrada</p>
        <h1 className="serif mt-3 text-[44px] leading-none">Este anuncio ya no está disponible.</h1>
        <div className="mt-8">
          <ButtonLink to="/explorar" variant="ink">
            Ver todas las casas
          </ButtonLink>
        </div>
      </Container>
    );
  }

  const ownerName = listing.contactName ?? "Propietario";
  const pending = Boolean(listing.status && listing.status !== "publicada");
  const price = listing.prices[duration] ?? listing.prices[availableDurations[0]] ?? 0;
  const effectiveDuration: DurationKey = listing.prices[duration]
    ? duration
    : (availableDurations[0] ?? "mes");
  const deposit = isShortStay(effectiveDuration)
    ? (listing.depositShort ?? listing.deposit)
    : listing.deposit;
  const startDate = fromIsoDay(start);
  const minAvail = fromIsoDay(listing.availableFrom);
  const effectiveStart = startDate < minAvail ? minAvail : startDate;
  const end = endDate(effectiveStart, effectiveDuration);
  const conflict = overlapsBooked(effectiveStart, effectiveDuration, listing.booked);

  function share() {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const ask = () => {
    send("contacto_abierto", { props: { anuncio: listing!.id } });
    setContactOpen(true);
  };

  return (
    <div className="pb-20 lg:pb-0">
      {pending && (
        <div className="border-b border-piedra-250/80 bg-aviso-bg">
          <Container className="py-3 text-[15px] text-aviso">
            <strong className="font-semibold">
              {listing.status === "pendiente" ? "Tu anuncio está en revisión." : "Este anuncio no está publicado."}
            </strong>{" "}
            {listing.status === "pendiente" &&
              "Solo tú puedes verlo con tu cuenta. Nuestro filtro automático encontró algo que revisar; en tu cuenta ves el motivo. Corrígelo con «Editar» y se publica solo, o espera a que lo revisemos."}
          </Container>
        </div>
      )}
      {/* ——— PHOTO FIRST (no text overlaid on photography) ——— */}
      <Container className="pt-6 lg:pt-8">
        <Folio
          left={
            <Link to="/explorar" className="inline-flex items-center gap-1.5 hover:underline">
              <ArrowLeft className="size-3.5" /> Explorar · {listing.zone}
            </Link>
          }
          right={pending ? "Sin publicar" : `Publicada el ${dateShort(fromIsoDay(listing.publishedAt))}`}
        />

        {allPhotos.length === 0 && (
          <div className="mt-5 flex aspect-[16/7] items-center justify-center rounded-card bg-arena-200 text-[16px] text-grafito-600">
            Quien publica aún no ha subido fotos.
          </div>
        )}
        <div className="mt-5 grid gap-2 overflow-hidden rounded-card sm:grid-cols-4 sm:grid-rows-2">
          {allPhotos.slice(0, 5).map((p, i) => (
            <button
              key={p.src}
              type="button"
              onClick={() => setGalleryOpen(p.src)}
              aria-label={`Abrir foto: ${p.caption}`}
              className={cx(
                "group relative overflow-hidden bg-arena-200",
                i === 0
                  ? "aspect-[16/10] sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[420px]"
                  : "hidden aspect-[4/3] sm:block",
              )}
            >
              <img
                src={photoUrl(p.src, i === 0 ? 1400 : 700, i === 0 ? 950 : 525)}
                srcSet={photoSrcSet(p.src, i === 0 ? [640, 1024, 1400] : [400, 700], 0.75)}
                sizes={i === 0 ? "(min-width: 640px) 50vw, 94vw" : "24vw"}
                alt={p.caption}
                loading={i < 2 ? "eager" : "lazy"}
                className="size-full object-cover transition-transform duration-700 ease-umbral group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[14px] text-grafito-600">
            {plural(allPhotos.length, "foto", "fotos")} · {spaceCount(listing)} espacios en el plano
          </p>
          <div className="flex items-center gap-2">
            {allPhotos.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGalleryOpen(allPhotos[0]?.src ?? null)}
              >
                Ver las {allPhotos.length} fotos
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={share}>
              <Share2 className="size-4" /> {copied ? "Enlace copiado" : "Compartir"}
            </Button>
            <SaveButton id={listing.id} />
          </div>
        </div>
      </Container>

      {/* ——— TITLE + TWO-COLUMN BODY ——— */}
      <Container className="pb-20 pt-8 lg:pb-28 lg:pt-10">
        <div className="border-b border-piedra-250/80 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            {pending && <Badge tone="aviso">En revisión</Badge>}
            {listing.promoted && <Badge tone="outline">Anuncio</Badge>}
            {listing.isNew && <Badge tone="ink">Tu anuncio</Badge>}
          </div>

          <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <h1 className="serif text-[42px] leading-[0.98] sm:text-[58px]">{listing.title}</h1>
              <p className="mt-3 text-[16px] text-grafito-700">
                {listing.type} · {roomsLabel(listing)} · {dec(listing.bathrooms)}{" "}
                {listing.bathrooms === 1 ? "baño" : "baños"} · {m2(listing.area)}
                {listing.lot && ` (${m2(listing.lot)} de terreno)`} ·{" "}
                <span className="font-medium text-negro">
                  {listing.colonia ? `${listing.colonia}, ` : ""}
                  {listing.zone}, {listing.region}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1.42fr_0.88fr] lg:gap-14">
          {/* ——— LEFT COLUMN: EVERYTHING WRITTEN ——— */}
          <div className="min-w-0 space-y-12">
            {/* Description */}
            <section aria-labelledby="resumen-h">
              <Eyebrow index="01">En pocas palabras</Eyebrow>
              <h2
                id="resumen-h"
                className="serif-text mt-3 text-[26px] leading-snug sm:text-[30px]"
              >
                {listing.summary}
              </h2>
              {listing.description && (
                <p className="mt-4 max-w-[68ch] whitespace-pre-line text-[16px] leading-relaxed text-grafito-700">
                  {listing.description}
                </p>
              )}
            </section>

            {/* Interactive floor plan */}
            <section aria-labelledby="plano-h" className="border-t border-piedra-250/80 pt-10">
              <Eyebrow index="02">El plano y cada espacio</Eyebrow>
              <h2 id="plano-h" className="head mt-2 text-[28px] sm:text-[34px]">
                Toca un cuarto para ver sus fotos y metros.
              </h2>
              <PlanExplorer
                floors={listing.floors}
                context={listing.title}
                dense
                className="mt-6 [&>div:last-child]:max-w-[640px]"
              />
            </section>

            {/* All 11 conditions */}
            <section
              aria-labelledby="condiciones-h"
              className="border-t border-piedra-250/80 pt-10"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <Eyebrow index="03">Las once condiciones · Toca una para ver el detalle</Eyebrow>
                  <h2 id="condiciones-h" className="head mt-2 text-[28px] sm:text-[34px]">
                    Lo que sí y lo que no.
                  </h2>
                </div>
                <ConditionsLegend />
              </div>
              <ConditionsSheet conditions={listing.conditions} className="mt-5" />
            </section>

            {/* House rules & what's included */}
            <section
              aria-labelledby="reglas-h"
              className="grid gap-10 border-t border-piedra-250/80 pt-12 md:grid-cols-2"
            >
              <div>
                <Eyebrow index="04">Reglas de convivencia</Eyebrow>
                <h2 id="reglas-h" className="head mt-3 text-[26px]">
                  Para vivir en paz.
                </h2>
                {listing.rules.length === 0 && (
                  <p className="mt-5 text-[16px] text-grafito-600">Sin reglas adicionales.</p>
                )}
                <ol className="mt-5 space-y-3.5 text-[16px] leading-snug text-grafito-700">
                  {listing.rules.map((rule, i) => (
                    <li key={i} className="grid grid-cols-[32px_1fr] items-baseline">
                      <span className="mono text-[14px] text-terracota-700">{String(i + 1).padStart(2, "0")}</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <Eyebrow index="05">Qué incluye el total</Eyebrow>
                <h2 className="head mt-3 text-[26px]">Lo que va dentro y lo que no.</h2>
                <ul className="mt-5 divide-y divide-piedra-250/80 border-y border-piedra-250/80 text-[15px]">
                  {listing.includes.map((inc) => (
                    <li key={inc.label} className="flex items-start justify-between gap-4 py-3">
                      <div>
                        <span className="font-medium text-negro">{inc.label}</span>
                        {inc.note && (
                          <span className="block text-[14px] text-grafito-600">{inc.note}</span>
                        )}
                      </div>
                      <span
                        className={cx(
                          "shrink-0 rounded-[3px] px-2 py-0.5 text-[14px] font-medium",
                          inc.included ? "bg-exito-bg text-exito" : "bg-arena-200 text-grafito-700",
                        )}
                      >
                        {inc.included ? "Incluido" : "No incluido"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Prices across all 5 durations */}
            <section aria-labelledby="plazos-h" className="border-t border-piedra-250/80 pt-12">
              <Eyebrow index="06">Precios por duración</Eyebrow>
              <h2 id="plazos-h" className="head mt-3 text-[32px]">
                Cuánto cuesta según el tiempo.
              </h2>
              <div className="mt-6 grid overflow-hidden rounded-card bg-crema-050 ring-1 ring-arena-200 sm:grid-cols-5">
                {DURATIONS.map((d, i) => {
                  const p = listing.prices[d.key];
                  const active = d.key === effectiveDuration;
                  return (
                    <button
                      key={d.key}
                      type="button"
                      disabled={!p}
                      onClick={() => p && setDuration(d.key)}
                      className={cx(
                        "flex flex-col justify-between p-4 text-left transition-colors",
                        i > 0 && "border-t border-arena-200 sm:border-l sm:border-t-0",
                        active
                          ? "bg-negro text-crema-100"
                          : p
                            ? "hover:bg-arena-200/70"
                            : "cursor-not-allowed opacity-45",
                      )}
                    >
                      <span
                        className={cx(
                          "label-sm",
                          active ? "text-terracota-300" : "text-grafito-600",
                        )}
                      >
                        {d.label}
                      </span>
                      {p ? (
                        <div className="mt-4">
                          <p className="text-[22px] font-semibold tabular-nums tracking-[-0.025em]">
                            {money(p)}
                          </p>
                          <p
                            className={cx(
                              "text-[14px]",
                              active ? "text-piedra-300" : "text-grafito-600",
                            )}
                          >
                            por {d.unit}
                          </p>
                          <p
                            className={cx(
                              "mt-2 text-[14px] tabular-nums",
                              active ? "text-piedra-300" : "text-grafito-600",
                            )}
                          >
                            {formatPeriodTotal(p, d.key)}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-4 text-[14px] text-grafito-600">No se ofrece</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Owner */}
            <section aria-labelledby="dueno-h" className="border-t border-piedra-250/80 pt-12">
              <Eyebrow index="07">Quién alquila</Eyebrow>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-5 rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 sm:p-7">
                <div className="flex items-center gap-4">
                  <Avatar name={ownerName} size={56} />
                  <div>
                    <h2 id="dueno-h" className="head text-[24px]">
                      {ownerName}.
                    </h2>
                    <p className="mt-0.5 text-[15px] text-grafito-600">
                      {"Alquila directamente, sin intermediarios"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={ask}>
                  <MessageSquare className="size-4" /> Escribir al propietario
                </Button>
              </div>

              {listing.nearby.length > 0 && (
                <div className="mt-10 rounded-card bg-arena-200 p-5 sm:p-6">
                  <p className="text-[14px] font-medium text-grafito-600">
                    Alrededores · {listing.zone}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                    {listing.nearby.map((n) => (
                      <div key={n.label}>
                        <dt className="text-[14px] text-grafito-600">{n.label}</dt>
                        <dd className="mt-0.5 text-[15px] font-semibold text-negro">{n.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              <p className="mt-5 text-[14px] text-grafito-600">
                La dirección exacta la comparte el propietario al coordinar la visita.
              </p>
            </section>
          </div>

          {/* ——— RIGHT COLUMN: STICKY DECISION PANEL ——— */}
          <aside aria-label="Cálculo y solicitud" className="lg:sticky lg:top-[88px]">
            <div className="overflow-hidden rounded-card bg-crema-050 ring-1 ring-piedra-250">
              {/* Specimen top: price on black */}
              <div className="on-dark bg-negro p-5 text-crema-100 sm:p-6">
                <p className="text-[14px] font-medium text-terracota-300">
                  Precio por {DURATION[effectiveDuration].label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[38px] font-semibold leading-none tabular-nums tracking-[-0.035em]">
                    {money(price)}
                  </span>
                  <span className="text-[14px] text-piedra-300">
                    {priceSuffix(effectiveDuration)}
                  </span>
                </div>
                <p className="mt-2 text-[14px] text-piedra-300">
                  {formatPeriodTotal(price, effectiveDuration)} · sin comisión
                </p>
              </div>

              {/* Rule bottom: duration, dates, breakdown, action */}
              <div className="p-5 sm:p-6">
                <p className="text-[14px] font-medium text-grafito-600">Duración</p>
                <DurationPicker
                  value={effectiveDuration}
                  onChange={setDuration}
                  available={availableDurations}
                  compact
                  stretch
                  size="sm"
                  className="mt-2"
                />

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[14px] font-medium text-grafito-600">Fechas</span>
                    <button
                      type="button"
                      onClick={() => setCalOpen((v) => !v)}
                      className="text-[14px] font-medium text-terracota-700 underline underline-offset-4"
                    >
                      {calOpen ? "Ocultar calendario" : "Cambiar fecha"}
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 overflow-hidden rounded-ctl ring-1 ring-piedra-250">
                    <button
                      type="button"
                      onClick={() => setCalOpen((v) => !v)}
                      className="bg-crema-100 p-3 text-left hover:bg-arena-200"
                    >
                      <span className="block text-[14px] text-grafito-600">Entrada</span>
                      <span className="mt-0.5 block text-[14px] font-semibold tabular-nums">
                        {dateShort(effectiveStart)}
                      </span>
                    </button>
                    <div className="border-l border-piedra-250 bg-crema-100 p-3">
                      <span className="block text-[14px] text-grafito-600">Salida</span>
                      <span className="mt-0.5 block text-[14px] font-semibold tabular-nums">
                        {dateShort(end)}
                      </span>
                    </div>
                  </div>
                  {calOpen && (
                    <div className="mt-3 rounded-card bg-crema-100 p-3.5 ring-1 ring-arena-200">
                      <Calendar
                        start={effectiveStart}
                        duration={effectiveDuration}
                        booked={listing.booked}
                        minDate={minAvail}
                        onSelect={(d) => {
                          setStart(isoDay(d));
                          setCalOpen(false);
                        }}
                      />
                    </div>
                  )}
                  {conflict && (
                    <p className="mt-2 rounded-ctl bg-aviso-bg px-3 py-2 text-[14px] font-medium text-aviso">
                      Esas fechas se cruzan con una reserva. Elige otra fecha de entrada.
                    </p>
                  )}
                </div>

                <dl className="mt-5 space-y-2.5 border-t border-arena-200 pt-4 text-[14px] tabular-nums">
                  <div className="flex justify-between">
                    <dt className="text-grafito-700">
                      {effectiveDuration === "seis" || effectiveDuration === "anio"
                        ? `Primer mes (de ${DURATION[effectiveDuration].units})`
                        : `Alquiler por ${DURATION[effectiveDuration].label}`}
                    </dt>
                    <dd className="font-medium">{money(price)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-grafito-700">Depósito reembolsable</dt>
                    <dd className="font-medium">{money(deposit)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-grafito-700">Comisión de AlquilasYa</dt>
                    <dd className="font-semibold text-exito">$0</dd>
                  </div>
                  <div className="flex justify-between border-t border-negro pt-3 text-[16px] font-semibold">
                    <dt>Para entrar</dt>
                    <dd>{money(price + deposit)}</dd>
                  </div>
                </dl>

                <div className="mt-5 space-y-2.5">
                  <Button variant="primary" size="lg" className="w-full" onClick={ask}>
                    Escribir al propietario <ArrowRight className="size-4" />
                  </Button>
                </div>

                <p className="mt-4 text-[14px] leading-snug text-grafito-600">
                  El pago y el contrato se acuerdan directamente con el propietario. AlquilasYa no
                  recibe ni guarda dinero.
                </p>
                {!listing.isNew && listing.status === "publicada" && (
                  <ReportButton listingId={listing.id} className="mt-3" />
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* More homes */}
        {moreListings.length > 0 && (
        <section aria-labelledby="otras-h" className="mt-24 border-t border-piedra-250/80 pt-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Eyebrow>Sigue comparando</Eyebrow>
              <h2 id="otras-h" className="head mt-2 text-[28px]">
                Otros alquileres con todo escrito.
              </h2>
            </div>
            <ButtonLink to="/explorar" variant="outline" size="sm">
              Ver todas <ArrowRight className="size-4" />
            </ButtonLink>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {moreListings.map((l) => (
              <ListingCard key={l.id} listing={l} duration={effectiveDuration} />
            ))}
          </div>
        </section>
        )}
      </Container>

      {/* Barra de acción fija en teléfono */}
      <div className="fixed inset-x-0 bottom-0 z-[900] border-t border-piedra-250 bg-crema-050/95 px-5 py-3 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <p className="min-w-0 leading-tight">
            <span className="text-[20px] font-semibold tabular-nums tracking-[-0.02em]">
              {money(price)}
            </span>{" "}
            <span className="text-[14px] text-grafito-600">{priceSuffix(effectiveDuration)}</span>
          </p>
          <Button variant="primary" onClick={ask}>
            Escribir
          </Button>
        </div>
      </div>

      <ContactDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        listing={listing}
        duration={effectiveDuration}
        start={isoDay(effectiveStart)}
      />

      {/* Lightbox */}
      <Modal
        open={Boolean(galleryOpen)}
        onClose={() => setGalleryOpen(null)}
        wide
        label={`Fotos de ${listing.title}`}
        title={`${listing.title} · ${allPhotos.length} fotos`}
      >
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
          {allPhotos.map((p) => (
            <figure key={p.src} className="overflow-hidden rounded-card bg-arena-200">
              <img
                src={photoUrl(p.src, 1200, 900)}
                alt={p.caption}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <figcaption className="bg-crema-100 px-3.5 py-2.5 text-[14px] text-grafito-700">
                {p.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </Modal>
    </div>
  );
}
