"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Listing } from "../data/types";
import { DURATION, type DurationKey } from "../lib/durations";
import { dateShort, fromIsoDay } from "../lib/format";
import { Link } from "../lib/router";
import { useStore } from "../lib/store";
import { Button, buttonClass, Modal } from "./ui";
import { fieldClass } from "./WaitlistForm";

const KEY = "alquilasya.contacto";

function waLink(whatsapp: string, text: string) {
  let digits = whatsapp.replace(/\D/g, "");
  if (digits.length === 8) digits = `503${digits}`; // número local de El Salvador
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

type Result = { owner: { name: string; whatsapp: string } | null };

/** «Escribir al propietario»: guarda el mensaje y, si el anuncio es real, abre el WhatsApp. */
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
  const { user } = useStore();
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError("");
    setMensaje(
      `Hola. Me interesa ${listing.title} por ${DURATION[duration].label}, desde el ${dateShort(fromIsoDay(start))}. ¿Sigue disponible?`,
    );
    let saved: Record<string, string> = {};
    try {
      saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, string>;
    } catch {
      /* sin datos guardados */
    }
    const name = saved.nombre || user?.name;
    const phone = saved.whatsapp || user?.whatsapp;
    if (name) setNombre(name);
    if (phone) setWhatsapp(phone);
  }, [open, listing.title, duration, start, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (nombre.trim().length < 2) return setError("Escribe tu nombre.");
    if (!/^\+?[0-9\s\-]{8,20}$/.test(whatsapp.trim()))
      return setError("Escribe un número de WhatsApp válido.");
    if (mensaje.trim().length < 5) return setError("Escribe tu mensaje.");

    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          listingTitle: listing.title,
          example: Boolean(listing.example),
          nombre: nombre.trim(),
          whatsapp: whatsapp.trim(),
          mensaje: mensaje.trim(),
          plazo: duration,
          desde: start,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as Result & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "No pudimos enviar tu mensaje.");
      try {
        localStorage.setItem(KEY, JSON.stringify({ nombre: nombre.trim(), whatsapp: whatsapp.trim() }));
      } catch {
        /* no pasa nada si no se puede guardar */
      }
      setResult({ owner: data.owner ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar tu mensaje.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      label={`Escribir sobre ${listing.title}`}
      title={result ? "Mensaje enviado" : "Escribir al propietario"}
    >
      {result ? (
        <div className="p-6" role="status">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-exito-bg text-exito">
            <Check className="size-5" strokeWidth={2.2} />
          </span>
          {result.owner ? (
            <>
              <h3 className="head mt-4 text-[24px]">Listo. Ahora sigue por WhatsApp.</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
                Guardamos tu mensaje. Para que {result.owner.name.split(" ")[0]} lo reciba de
                inmediato, envíaselo también por WhatsApp.
              </p>
              <a
                href={waLink(result.owner.whatsapp, mensaje)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("primary", "lg", "mt-5 w-full")}
              >
                Abrir WhatsApp <ArrowRight className="size-4" />
              </a>
            </>
          ) : listing.example ? (
            <>
              <h3 className="head mt-4 text-[24px]">Recibimos tu mensaje.</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
                Este anuncio es un ejemplo ilustrativo: todavía no hay un propietario detrás. Tomamos
                nota de lo que buscas para avisarte cuando haya inmuebles reales así.
              </p>
              <Link to="/lista" className={buttonClass("ink", "lg", "mt-5 w-full")}>
                Unirme a la lista de espera <ArrowRight className="size-4" />
              </Link>
            </>
          ) : (
            <>
              <h3 className="head mt-4 text-[24px]">Recibimos tu mensaje.</h3>
              <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
                Este anuncio aún está en revisión. Te contactaremos por WhatsApp en cuanto esté
                publicado.
              </p>
            </>
          )}
          <Button variant="ghost" className="mt-2 w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4 p-6">
          <p className="text-[15px] leading-snug text-grafito-700">
            {listing.title} · {listing.zone}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[14px] font-medium text-grafito-700">Tu nombre</span>
              <input
                type="text"
                autoComplete="name"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="text-[14px] font-medium text-grafito-700">Tu WhatsApp</span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+503 7000 0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className={fieldClass}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[14px] font-medium text-grafito-700">Mensaje</span>
            <textarea
              rows={4}
              value={mensaje}
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
            Tu nombre y tu WhatsApp solo se usan para responderte sobre este inmueble.
          </p>
        </form>
      )}
    </Modal>
  );
}
