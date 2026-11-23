"use client";

import { ArrowLeft, BadgeCheck, BookmarkPlus, Send, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { FounderBadge } from "../components/HostFacts";
import { Avatar, Button, ButtonLink } from "../components/ui";
import { memberSince } from "../lib/founder";
import { cx, money, time } from "../lib/format";
import { photoUrl } from "../lib/photos";
import { Link, useNavigate, useSearchParams } from "../lib/router";
import { useStore } from "../lib/store";

type Conversation = {
  id: string;
  listing_id: string;
  listing_title: string;
  zone: string;
  region: string;
  cover: string | null;
  price_month: string | null;
  i_am_owner: boolean;
  other_name: string;
  other_since: string;
  other_verified: boolean;
  other_founder: boolean;
  last_message_at: string;
  last_body: string | null;
  last_mine: boolean | null;
  unread: number;
};
type Message = { id: string; mine: boolean; body: string; created_at: string };

const day = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });

/** Respuestas de un toque: lo que más se escribe en cada lado de la conversación. */
const QUICK = {
  owner: [
    "Sí, está disponible.",
    "¿Cuándo quieres verla?",
    "¿Para cuántas personas sería y desde qué fecha?",
    "Lo siento, ya se alquiló. Gracias por escribir.",
  ],
  renter: [
    "¿Sigue disponible?",
    "¿Cuándo puedo ir a verla?",
    "¿Qué requisitos piden para alquilar?",
  ],
};
function stamp(iso: string) {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString() ? time(d) : day.format(d).replace(".", "");
}

/** Chat privado entre quien busca y quien publica. Se actualiza solo cada pocos segundos. */
export function Chat() {
  const { user, authLoaded, refreshMe } = useStore();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const activeId = params.get("c");
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lastId = useRef("0");
  /** Respuestas propias guardadas en la cuenta. */
  const [saved, setSaved] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Los efectos dependen del id, no del objeto: refrescar la cuenta no reinicia el chat.
  const userId = user?.id;
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoaded && !user) navigate("/entrar?next=/mensajes", { replace: true });
  }, [authLoaded, user, navigate]);

  const loadList = useCallback(async () => {
    const res = await fetch("/api/chat");
    if (!res.ok) return;
    const data = (await res.json()) as { conversations: Conversation[] };
    setConversations(data.conversations);
  }, []);

  const loadMessages = useCallback(async (id: string, reset: boolean) => {
    if (reset) lastId.current = "0";
    const res = await fetch(`/api/chat/${id}?after=${lastId.current}`);
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Message[] };
    if (data.messages.length) lastId.current = data.messages[data.messages.length - 1].id;
    setMessages((current) => (reset ? data.messages : [...current, ...data.messages]));
  }, []);

  // Lista: al entrar y cada 15 s mientras la pestaña está visible.
  useEffect(() => {
    if (!userId) return;
    loadList();
    const t = window.setInterval(() => document.visibilityState === "visible" && loadList(), 15_000);
    return () => window.clearInterval(t);
  }, [userId, loadList]);

  // Conversación abierta: mensajes nuevos cada 4 s.
  useEffect(() => {
    if (!userId || !activeId) return;
    setMessages([]);
    loadMessages(activeId, true).then(() => {
      loadList();
      refreshMe();
    });
    const t = window.setInterval(
      () => document.visibilityState === "visible" && loadMessages(activeId, false),
      4_000,
    );
    return () => window.clearInterval(t);
  }, [userId, activeId, loadMessages, loadList, refreshMe]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, activeId]);

  useEffect(() => {
    if (!userId) return;
    fetch("/api/chat/respuestas")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { replies?: string[] } | null) => d?.replies && setSaved(d.replies))
      .catch(() => {});
  }, [userId]);

  /** Un toque: la respuesta queda escrita para revisarla o completarla antes de enviar. */
  function pickReply(reply: string) {
    setText(reply);
    window.setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(reply.length, reply.length);
    }, 0);
  }

  async function storeReplies(next: string[], done: string) {
    const before = saved;
    setSaved(next);
    const res = await fetch("/api/chat/respuestas", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ replies: next }),
    }).catch(() => null);
    if (!res?.ok) {
      setSaved(before);
      const data = (await res?.json().catch(() => ({}))) as { error?: string } | undefined;
      return setError(data?.error ?? "No se pudo guardar la respuesta.");
    }
    setError("");
    setNotice(done);
    window.setTimeout(() => setNotice(""), 2500);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    setError("");
    const res = await fetch(`/api/chat/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      return setError(data.error ?? "No se pudo enviar el mensaje.");
    }
    setText("");
    await loadMessages(activeId, false);
    loadList();
  }

  if (!user) return <div className="min-h-[60vh]" aria-busy="true" />;

  const active = conversations?.find((c) => c.id === activeId);

  return (
    <div className="mx-auto grid h-[calc(100dvh-68px)] min-h-[480px] w-full max-w-[1440px] overflow-hidden border-x border-piedra-250/60 bg-crema-100 md:grid-cols-[340px_1fr]">
      {/* ——— Conversaciones ——— */}
      <aside
        aria-label="Conversaciones"
        className={cx(
          "flex h-full min-h-0 flex-col border-r border-piedra-250/80 bg-crema-050",
          activeId && "hidden md:flex",
        )}
      >
        <div className="border-b border-arena-200 px-5 py-4">
          <h1 className="head text-[24px]">Mensajes.</h1>
          <p className="mt-1 text-[14px] text-grafito-600">
            Privados entre tú y la otra persona.
          </p>
        </div>
        {conversations === null ? (
          <div className="m-5 h-20 animate-pulse rounded-card bg-arena-200" />
        ) : conversations.length === 0 ? (
          <div className="p-6">
            <p className="text-[16px] leading-relaxed text-grafito-700">
              Aún no tienes conversaciones. Empiezan cuando escribes desde la ficha de un anuncio, o
              cuando alguien te escribe por el tuyo.
            </p>
            <ButtonLink to="/explorar" variant="ink" className="mt-5">
              Explorar alquileres
            </ButtonLink>
          </div>
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-arena-200 overflow-y-auto">
            {conversations.map((c) => {
              const on = c.id === activeId;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setParams({ c: c.id })}
                    aria-current={on ? "true" : undefined}
                    className={cx(
                      "flex w-full items-start gap-3 px-5 py-4 text-left transition-colors",
                      on ? "bg-negro text-crema-100" : "hover:bg-arena-200/70",
                    )}
                  >
                    <Avatar name={c.other_name} size={42} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[16px] font-semibold">{c.other_name}</span>
                        <span className={cx("shrink-0 text-[14px]", on ? "text-piedra-300" : "text-grafito-600")}>
                          {stamp(c.last_message_at)}
                        </span>
                      </span>
                      <span className={cx("block truncate text-[14px]", on ? "text-piedra-300" : "text-grafito-600")}>
                        {c.listing_title}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className={cx("truncate text-[15px]", on ? "text-crema-100/90" : "text-grafito-700")}>
                          {c.last_mine ? "Tú: " : ""}
                          {c.last_body}
                        </span>
                        {c.unread > 0 && !on && (
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-terracota-600 px-1.5 text-[12px] font-semibold text-white">
                            {c.unread}
                            <span className="sr-only"> sin leer</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* ——— Conversación abierta ——— */}
      <section
        aria-label={active ? `Conversación con ${active.other_name}` : "Conversación"}
        className={cx("flex h-full min-h-0 min-w-0 flex-col", !activeId && "hidden md:flex")}
      >
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-[16px] text-grafito-600">
            {activeId && conversations ? "Esa conversación no existe." : "Elige una conversación."}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-piedra-250/80 bg-crema-050 px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={() => setParams({})}
                aria-label="Volver a conversaciones"
                className="-ml-1 inline-flex size-10 items-center justify-center rounded-ctl hover:bg-arena-200 md:hidden"
              >
                <ArrowLeft className="size-5" />
              </button>
              {active.cover && (
                <img
                  src={photoUrl(active.cover, 120, 90)}
                  alt=""
                  className="hidden h-12 w-16 rounded-[3px] object-cover sm:block"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-[16px] font-semibold">{active.other_name}</span>
                  {active.other_founder && <FounderBadge className="shrink-0" />}
                </p>
                <p className="flex items-center gap-1 truncate text-[13px] text-grafito-600">
                  {active.other_verified && <BadgeCheck className="size-3.5 shrink-0 text-exito" aria-label="Correo verificado" />}
                  <span className="truncate">
                    En AlquilasYa desde {memberSince(active.other_since)}
                  </span>
                </p>
                <Link
                  to={`/casa/${active.listing_id}`}
                  className="block truncate text-[14px] text-grafito-600 underline-offset-4 hover:underline"
                >
                  {active.listing_title} · {active.zone}
                  {active.price_month ? ` · ${money(Number(active.price_month))} / mes` : ""}
                </Link>
              </div>
              <span className="hidden shrink-0 rounded-[3px] bg-arena-200 px-2 py-1 text-[14px] text-grafito-700 sm:block">
                {active.i_am_owner ? "Te escriben por tu anuncio" : "Propietario"}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6" role="log" aria-live="polite">
              {messages.map((m) => (
                <div key={m.id} className={cx("flex flex-col", m.mine ? "items-end" : "items-start")}>
                  <p
                    className={cx(
                      "max-w-[84%] whitespace-pre-wrap break-words rounded-card px-4 py-2.5 text-[16px] leading-relaxed sm:max-w-[70%]",
                      m.mine ? "bg-negro text-crema-100" : "bg-crema-050 text-negro ring-1 ring-piedra-250",
                    )}
                  >
                    {m.body}
                  </p>
                  <span className="mt-1 px-1 text-[14px] text-grafito-600">{stamp(m.created_at)}</span>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="border-t border-piedra-250/80 bg-crema-050 p-3 sm:px-6 sm:py-4">
              {error && (
                <p role="alert" className="mb-2 text-[14px] font-medium text-error">
                  {error}
                </p>
              )}
              <div
                role="group"
                aria-label="Respuestas rápidas"
                className="-mx-3 mb-2.5 flex gap-2 overflow-x-auto px-3 pb-0.5 no-scrollbar sm:-mx-6 sm:px-6"
              >
                {QUICK[active.i_am_owner ? "owner" : "renter"]
                  .filter((q) => !saved.includes(q))
                  .map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => pickReply(q)}
                      className="shrink-0 whitespace-nowrap rounded-full bg-crema-100 px-3.5 py-1.5 text-[14px] text-grafito-700 ring-1 ring-piedra-250 transition hover:text-negro hover:ring-negro"
                    >
                      {q}
                    </button>
                  ))}
                {saved.map((q) => (
                  <span
                    key={q}
                    className="inline-flex max-w-[260px] shrink-0 items-center rounded-full bg-arena-200 text-[14px] text-negro ring-1 ring-piedra-250"
                  >
                    <button type="button" onClick={() => pickReply(q)} title={q} className="truncate py-1.5 pl-3.5 pr-1.5 text-left">
                      {q}
                    </button>
                    <button
                      type="button"
                      onClick={() => storeReplies(saved.filter((x) => x !== q), "Respuesta borrada.")}
                      aria-label={`Borrar la respuesta «${q}»`}
                      className="mr-1 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-grafito-600 hover:bg-crema-100 hover:text-error"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <label htmlFor="chat-input" className="sr-only">
                  Escribe un mensaje
                </label>
                <textarea
                  ref={inputRef}
                  id="chat-input"
                  rows={1}
                  value={text}
                  maxLength={2000}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder={`Escríbele a ${active.other_name.split(" ")[0]}…`}
                  className="max-h-32 min-h-12 flex-1 resize-none rounded-ctl bg-crema-100 px-3.5 py-3 text-[16px] ring-1 ring-piedra-250 outline-none focus:ring-2 focus:ring-negro"
                />
                <Button type="submit" variant="primary" size="md" className="h-12" disabled={!text.trim() || sending}>
                  Enviar <Send className="size-4" />
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="text-[14px] text-grafito-600">
                  {notice || "No pagues ni envíes documentos antes de visitar el inmueble."}
                </p>
                {text.trim() && text.trim().length <= 300 && !saved.includes(text.trim()) && (
                  <button
                    type="button"
                    onClick={() => storeReplies([...saved, text.trim()].slice(-12), "Guardada en tus respuestas rápidas.")}
                    className="inline-flex items-center gap-1 text-[14px] font-medium text-grafito-700 underline underline-offset-4 hover:text-negro"
                  >
                    <BookmarkPlus className="size-4" /> Guardar como respuesta rápida
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
