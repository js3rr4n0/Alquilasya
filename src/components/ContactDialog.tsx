"use client";

import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import type { Listing } from "../data/types";
import { DURATION, type DurationKey } from "../lib/durations";
import { dateShort, fromIsoDay } from "../lib/format";
import { Link, useNavigate } from "../lib/router";
import { useStore } from "../lib/store";
import { track } from "../lib/track";
import { Button, buttonClass, Modal } from "./ui";
import { HostFacts } from "./HostFacts";
import { fieldClass } from "./WaitlistForm";

/**
 * «Escribir al propietario». Escribir exige una cuenta con el correo confirmado;
 * la conversación ocurre en el chat privado del sitio y nadie ve el número de nadie.
 */
export function ContactDialog({
  open,
  onClose,
  listing,
  duration,
  start,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  duration: DurationKey;
  start: string;
}) {
  const { user, authLoaded } = useStore();
  const navigate = useNavigate();
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const here = `/casa/${encodeURIComponent(listing.id)}`;
  const own = listing.isNew;
  const available = listing.status === "publicada";

  useEffect(() => {
    if (!open) return;
    setError("");
    setMensaje(
      `Hola. Me interesa ${listing.title} por ${DURATION[duration].label}, desde el ${dateShort(fromIsoDay(start))}. ¿Sigue disponible?`,
    );
  }, [open, listing.title, duration, start]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!mensaje.trim()) return setError("Escribe tu mensaje.");
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, body: mensaje.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error ?? "No pudimos enviar tu mensaje.");
      track("mensaje_enviado", { via: "chat" });
      onClose();
      navigate(`/mensajes?c=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar tu mensaje.");
    } finally {
      setSending(false);
    }
  }

  let body: React.ReactNode;
  if (!authLoaded) {
    body = <div className="h-40" aria-busy="true" />;
  } else if (!user) {
    body = (
      <div className="p-6">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-arena-200 text-negro">
          <Lock className="size-5" />
        </span>
        <h3 className="head mt-4 text-[24px]">Entra para escribirle.</h3>
        <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
          Para cuidar a quien publica, los mensajes se envían desde una cuenta con el correo
          confirmado. Hablan por el chat privado del sitio y nadie ve el número de nadie.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <Link
            to={`/entrar?modo=crear&next=${encodeURIComponent(here)}`}
            className={buttonClass("primary", "lg", "w-full")}
          >
            Crear cuenta <ArrowRight className="size-4" />
          </Link>
          <Link to={`/entrar?next=${encodeURIComponent(here)}`} className={buttonClass("outline", "lg", "w-full")}>
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    );
  } else if (!user.verified) {
    body = (
      <div className="p-6">
        <h3 className="head text-[24px]">Confirma tu correo.</h3>
        <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
          Te enviamos un código a {user.email}. Confírmalo y vuelves aquí para escribir.
        </p>
        <Link
          to={`/verificar?next=${encodeURIComponent(here)}`}
          className={buttonClass("primary", "lg", "mt-5 w-full")}
        >
          Confirmar mi correo <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  } else if (own) {
    body = (
      <div className="p-6">
        <h3 className="head text-[24px]">Este anuncio es tuyo.</h3>
        <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
          Los mensajes que te envíen por él llegan a tu bandeja de Mensajes.
        </p>
        <Link to="/mensajes" className={buttonClass("ink", "lg", "mt-5 w-full")}>
          Ir a Mensajes
        </Link>
      </div>
    );
  } else if (!available) {
    body = (
      <div className="p-6">
        <h3 className="head text-[24px]">Este anuncio no está disponible.</h3>
        <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
          Solo se puede escribir sobre anuncios publicados.
        </p>
      </div>
    );
  } else {
    body = (
      <form onSubmit={submit} noValidate className="space-y-4 p-6">
        <p className="text-[15px] leading-snug text-grafito-700">
          {listing.title} · {listing.zone}
        </p>
        {listing.host && (
          <div className="rounded-ctl bg-crema-100 px-3.5 py-2.5 ring-1 ring-arena-200">
            <p className="text-[15px] font-semibold text-negro">Le escribes a {listing.contactName ?? "quien publica"}</p>
            <HostFacts host={listing.host} compact className="mt-1" />
          </div>
        )}
        <label className="block">
          <span className="text-[14px] font-medium text-grafito-700">Mensaje</span>
          <textarea
            rows={4}
            value={mensaje}
            maxLength={2000}
            onChange={(e) => setMensaje(e.target.value)}
            className={`${fieldClass} h-auto py-3 leading-relaxed`}
          />
        </label>
        {error && (
          <p role="alert" className="rounded-ctl bg-error-bg px-3.5 py-2.5 text-[15px] font-medium text-error">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              Enviar mensaje <ArrowRight className="size-4" />
            </>
          )}
        </Button>
        <p className="text-[14px] leading-snug text-grafito-600">
          Se abre un chat privado con el propietario dentro de AlquilasYa.
        </p>
      </form>
    );
  }

  return (
    <Modal open={open} onClose={onClose} label={`Escribir sobre ${listing.title}`} title="Escribir al propietario">
      {body}
    </Modal>
  );
}
