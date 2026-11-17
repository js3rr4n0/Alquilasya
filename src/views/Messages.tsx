"use client";

import { ArrowLeft, EyeOff, Lock, Send, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "@/lib/router";
import { roomsLabel } from "../components/ListingCard";
import { Avatar, Badge, Button, Switch } from "../components/ui";
import { PEOPLE } from "../data/people";
import { RENTER } from "../data/renter";
import type { Conversation } from "../data/types";
import { cx, m2, money, time } from "../lib/format";
import { photoUrl } from "../lib/photos";
import { SUGGESTED_QUESTIONS } from "../lib/replies";
import { useStore } from "../lib/store";

const DISAPPEARING: Conversation["disappearing"][] = ["Nunca", "30 días", "7 días", "24 horas"];

export function Messages() {
  const {
    conversations,
    listings,
    typing,
    sendMessage,
    shareExpediente,
    setReserved,
    setDisappearing,
    markRead,
  } = useStore();
  const [params, setParams] = useSearchParams();
  const paramId = params.get("c");
  const active = conversations.find((c) => c.id === paramId) ?? conversations[0];
  const [mobilePane, setMobilePane] = useState<"list" | "chat">(paramId ? "chat" : "list");
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active?.unread) markRead(active.id);
  }, [active?.id, active?.unread, markRead]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [active?.id, active?.messages.length, typing[active?.id ?? ""]]);

  const listing = listings.find((l) => l.id === active?.listingId) ?? listings[0];
  const owner = PEOPLE[active?.ownerId ?? "andres"] ?? PEOPLE.andres;

  function select(id: string) {
    setParams({ c: id }, { replace: true });
    setMobilePane("chat");
  }

  function submit(body = text) {
    if (!active || !body.trim()) return;
    sendMessage(active.id, body);
    setText("");
  }

  return (
    <>
    <div className="border-b border-piedra-250/80 bg-arena-200 px-5 py-2.5 text-center text-[14px] text-grafito-700">
      <strong className="font-semibold text-negro">Próximamente · demostración.</strong> Así serán
      los mensajes dentro del sitio. Las conversaciones y las respuestas son de ejemplo.
    </div>
    <div className="mx-auto grid h-[calc(100dvh-68px-41px)] min-h-[520px] w-full max-w-[1440px] overflow-hidden border-x border-piedra-250/60 bg-crema-100 md:grid-cols-[310px_1fr] lg:grid-cols-[320px_1fr_320px]">
      {/* ——— THREAD LIST ——— */}
      <aside
        aria-label="Conversaciones"
        className={cx(
          "flex h-full flex-col border-r border-piedra-250/80 bg-crema-050",
          mobilePane === "chat" && "hidden md:flex",
        )}
      >
        <div className="border-b border-arena-200 px-5 py-4">
          <p className="text-[14px] font-medium text-terracota-700">Mensajes</p>
          <h1 className="head mt-1 text-[22px]">Conversaciones.</h1>
          <p className="mt-1 text-[14px] text-grafito-600">
            Mensajes privados. En modo reservado no ven tu nombre.
          </p>
        </div>

        <ul className="flex-1 divide-y divide-arena-200 overflow-y-auto">
          {conversations.map((c) => {
            const l = listings.find((x) => x.id === c.listingId);
            const p = PEOPLE[c.ownerId] ?? PEOPLE.andres;
            const last = c.messages[c.messages.length - 1];
            const isActive = c.id === active?.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => select(c.id)}
                  className={cx(
                    "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors",
                    isActive ? "bg-negro text-crema-100" : "hover:bg-arena-200/70",
                  )}
                >
                  <Avatar src={p.photo} name={p.name} initials={p.initials} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[14px] font-semibold">{p.name}</span>
                      <span
                        className={cx(
                          "mono shrink-0 text-[14px]",
                          isActive ? "text-piedra-300" : "text-grafito-600",
                        )}
                      >
                        {last ? time(new Date(last.at)) : ""}
                      </span>
                    </div>
                    <p
                      className={cx(
                        "truncate text-[14px]",
                        isActive ? "text-piedra-300" : "text-grafito-600",
                      )}
                    >
                      {l?.title}
                    </p>
                    <p
                      className={cx(
                        "mt-1 line-clamp-1 text-[14px]",
                        isActive ? "text-crema-100/90" : "text-grafito-700",
                      )}
                    >
                      {last?.text}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {c.reserved && (
                        <span
                          className={cx(
                            "label-sm inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5",
                            isActive
                              ? "bg-crema-100/15 text-crema-100"
                              : "bg-arena-200 text-grafito-700",
                          )}
                        >
                          <EyeOff className="size-3" /> Reservado
                        </span>
                      )}
                      {c.unread > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracota-600 px-1 text-[12px] font-semibold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ——— ACTIVE CONVERSATION ——— */}
      {active && (
        <section
          aria-label={`Conversación con ${owner.name}`}
          className={cx(
            "flex h-full min-w-0 flex-col bg-crema-100",
            mobilePane === "list" && "hidden md:flex",
          )}
        >
          {/* Chat header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-piedra-250/80 bg-crema-050 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobilePane("list")}
                aria-label="Volver a conversaciones"
                className="-ml-1 inline-flex size-9 items-center justify-center rounded-ctl hover:bg-arena-200 md:hidden"
              >
                <ArrowLeft className="size-4" />
              </button>
              <Avatar src={owner.photo} name={owner.name} initials={owner.initials} size={38} />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{owner.name}</p>
                <p className="truncate text-[14px] text-grafito-600">
                  {listing.title} · {owner.responseTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={active.reserved}
                onClick={() => setReserved(active.id, !active.reserved)}
                className={cx(
                  "inline-flex h-9 items-center gap-1.5 rounded-ctl px-3 text-[14px] font-medium transition-colors",
                  active.reserved
                    ? "bg-negro text-crema-100"
                    : "bg-arena-200 text-grafito-700 hover:text-negro",
                )}
              >
                <EyeOff className="size-3.5" />
                Modo reservado: {active.reserved ? "sí" : "no"}
              </button>
            </div>
          </div>

          {/* Reserved banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-piedra-250/60 bg-arena-200/70 px-4 py-2 text-[14px] text-grafito-700 sm:px-6">
            <span className="inline-flex items-center gap-2">
              <Avatar
                src={active.reserved ? undefined : RENTER.photo}
                name={RENTER.name}
                reserved={active.reserved}
                size={20}
                square={active.reserved}
              />
              {active.reserved ? (
                <span>
                  <strong>{owner.name.split(" ")[0]}</strong> te ve como{" "}
                  <em>Inquilina en modo reservado</em>. Pregunta lo que necesites sin que te
                  juzguen.
                </span>
              ) : (
                <span>
                  <strong>{owner.name.split(" ")[0]}</strong> ve tu nombre ({RENTER.firstName}) y tu
                  foto.
                </span>
              )}
            </span>
            {!active.expedienteShared && (
              <button
                type="button"
                onClick={() => shareExpediente(active.id)}
                className="font-semibold text-terracota-700 underline underline-offset-4"
              >
                Compartir mi perfil
              </button>
            )}
          </div>

          {/* Message stream */}
          <div
            className="flex-1 space-y-3.5 overflow-y-auto px-4 py-5 sm:px-6"
            role="log"
            aria-live="polite"
          >
            {active.messages.map((m) => {
              if (m.kind === "system") {
                return (
                  <div key={m.id} className="my-2 text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-ctl bg-arena-200 px-3 py-1.5 text-[14px] text-grafito-600">
                      <Lock className="size-3" /> {m.text}
                    </span>
                  </div>
                );
              }
              if (m.kind === "expediente") {
                return (
                  <div
                    key={m.id}
                    className="ml-auto max-w-md rounded-card bg-crema-050 p-4 ring-2 ring-negro"
                  >
                    <div className="flex items-center justify-between">
                      <span className="label text-terracota-700">
                        Perfil compartido · 14 días
                      </span>
                      <Badge tone="neutral">Perfil</Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar src={RENTER.photo} name={RENTER.name} size={40} />
                      <div>
                        <p className="text-[15px] font-semibold">{RENTER.name}</p>
                        <p className="text-[14px] text-grafito-600">
                          {RENTER.work.role} · {RENTER.household.summary}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-arena-200 pt-2.5 text-[14px]">
                      <Link
                        to="/expediente?vista=propietario"
                        className="font-medium text-terracota-700 underline underline-offset-4"
                      >
                        Ver como propietario
                      </Link>
                    </div>
                  </div>
                );
              }
              const mine = m.from === "me";
              return (
                <div key={m.id} className={cx("flex flex-col", mine ? "items-end" : "items-start")}>
                  <div
                    className={cx(
                      "max-w-[82%] rounded-card px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[72%]",
                      mine
                        ? "bg-negro text-crema-100"
                        : "bg-crema-050 text-negro ring-1 ring-piedra-250",
                    )}
                  >
                    <p className="text-pretty">{m.text}</p>
                  </div>
                  <span className="mt-1 px-1 text-[14px] text-grafito-600">
                    {mine ? (m.reserved ? "Tú · modo reservado" : "Tú") : owner.name.split(" ")[0]}{" "}
                    · {time(new Date(m.at))}
                  </span>
                </div>
              );
            })}

            {typing[active.id] && (
              <div className="flex items-center gap-2 text-[14px] text-grafito-600">
                <span className="inline-flex gap-1 rounded-card bg-crema-050 px-3 py-2 ring-1 ring-piedra-250">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 rounded-full bg-negro"
                      style={{ animation: `typing 1.1s ${d}ms infinite` }}
                    />
                  ))}
                </span>
                {owner.name.split(" ")[0]} está escribiendo…
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick questions + composer */}
          <div className="border-t border-piedra-250/80 bg-crema-050 p-3 sm:px-6 sm:py-4">
            <div className="mb-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              <span className="shrink-0 pr-1 text-[14px] text-grafito-600">Preguntar:</span>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => submit(q)}
                  className="shrink-0 rounded-[3px] bg-arena-200 px-3 py-1.5 text-[14px] text-grafito-700 hover:bg-piedra-250/70 hover:text-negro"
                >
                  {q}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="chat-input" className="sr-only">
                Escribe un mensaje
              </label>
              <input
                id="chat-input"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  active.reserved
                    ? "Pregunta en modo reservado (no ven tu nombre)…"
                    : `Escríbele a ${owner.name.split(" ")[0]}…`
                }
                className="h-11 flex-1 rounded-ctl bg-crema-100 px-3.5 text-[15px] ring-1 ring-piedra-250 outline-none focus:ring-negro"
              />
              <Button type="submit" variant="primary" disabled={!text.trim()}>
                Enviar <Send className="size-4" />
              </Button>
            </form>
          </div>
        </section>
      )}

      {/* ——— RIGHT PANE: LISTING + PRIVACY CONTROLS ——— */}
      {active && (
        <aside
          aria-label="Propiedad y privacidad"
          className="hidden h-full flex-col justify-between overflow-y-auto border-l border-piedra-250/80 bg-crema-050 p-5 lg:flex"
        >
          <div className="space-y-6">
            <div>
              <p className="text-[14px] font-medium text-grafito-600">Propiedad</p>
              <Link
                to={`/casa/${listing.id}`}
                className="group mt-2.5 block overflow-hidden rounded-card bg-crema-100 ring-1 ring-arena-200"
              >
                <img
                  src={photoUrl(listing.cover, 480, 320)}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="p-3.5">
                  <p className="text-[16px] font-semibold tabular-nums">
                    {money(listing.prices.mes ?? Object.values(listing.prices)[0] ?? 0)}{" "}
                    <span className="text-[14px] font-normal text-grafito-600">
                      / mes · total
                    </span>
                  </p>
                  <p className="mt-0.5 text-[14px] font-medium group-hover:underline">
                    {listing.title}
                  </p>
                  <p className="text-[14px] text-grafito-600">
                    {roomsLabel(listing)} · {m2(listing.area)} · {listing.zone}
                  </p>
                </div>
              </Link>
            </div>

            <div className="border-t border-arena-200 pt-5">
              <p className="text-[14px] font-medium text-grafito-600">Privacidad de esta conversación</p>
              <Switch
                checked={active.reserved}
                onChange={(v) => setReserved(active.id, v)}
                label="Modo reservado"
                description="Oculta tu nombre, tu foto y tu perfil mientras haces preguntas."
                className="mt-3"
              />

              <div className="mt-4">
                <span className="text-[14px] text-grafito-600">Borrar mensajes automáticamente</span>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {DISAPPEARING.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDisappearing(active.id, d)}
                      className={cx(
                        "h-9 rounded-ctl text-[14px] font-medium",
                        active.disappearing === d
                          ? "bg-negro text-crema-100"
                          : "bg-arena-200 text-grafito-700 hover:text-negro",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-arena-200 pt-5">
              <p className="text-[14px] font-medium text-grafito-600">Tu perfil</p>
              <p className="mt-2 text-[14px] leading-snug text-grafito-700">
                {active.expedienteShared
                  ? `${owner.name.split(" ")[0]} ya puede ver tu perfil durante 14 días.`
                  : "Cuando las respuestas te convenzan, compártelo para que sepan quién eres."}
              </p>
              {!active.expedienteShared && (
                <Button
                  variant="ink"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => shareExpediente(active.id)}
                >
                  <ShieldCheck className="size-4" /> Compartir mi perfil
                </Button>
              )}
            </div>
          </div>

          <p className="border-t border-arena-200 pt-4 text-[14px] text-grafito-600">
            Vista de demostración: nada de lo que escribas aquí se envía a nadie.
          </p>
        </aside>
      )}

    </div>
    </>
  );
}
