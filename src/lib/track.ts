"use client";

import { track as vercelTrack } from "@vercel/analytics";

/**
 * Medición del sitio. Cada evento va a la analítica propia (/api/t, la que ve
 * el panel de admin), a Vercel Analytics y, si está configurado, a GA4.
 */
export type Conversion =
  | "cuenta_creada"
  | "correo_verificado"
  | "anuncio_enviado"
  | "anuncio_editado"
  | "mensaje_enviado"
  | "lista_espera";

export type EventName = Conversion | "pagina" | "tiempo" | "busqueda" | "ficha_vista" | "contacto_abierto";

type Props = Record<string, string | number | boolean>;
type Gtag = (command: "event", name: string, params?: Props) => void;

const VID = "ay_vid";
const SID = "ay_sid";
const SESSION_IDLE_MS = 30 * 60 * 1000;

function randomId() {
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
}

/** Visitante (persiste en este navegador) y sesión (se renueva tras 30 min sin actividad). */
function ids() {
  let vid = "";
  let sid = "";
  try {
    vid = localStorage.getItem(VID) ?? "";
    if (!vid) {
      vid = randomId();
      localStorage.setItem(VID, vid);
    }
    const saved = JSON.parse(sessionStorage.getItem(SID) ?? "null") as { id: string; at: number } | null;
    sid = saved && Date.now() - saved.at < SESSION_IDLE_MS ? saved.id : randomId();
    sessionStorage.setItem(SID, JSON.stringify({ id: sid, at: Date.now() }));
  } catch {
    // Almacenamiento bloqueado: se mide igual, sin poder unir visitas.
    vid ||= randomId();
    sid ||= randomId();
  }
  return { vid, sid };
}

const optedOut = () =>
  typeof navigator !== "undefined" &&
  ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true ||
    navigator.doNotTrack === "1");

/** Envía un evento a la analítica propia. No bloquea nada ni lanza errores. */
export function send(name: EventName, extra: { dur?: number; props?: Props } = {}) {
  try {
    if (optedOut()) return;
    const url = new URL(window.location.href);
    const body = JSON.stringify({
      name,
      ...ids(),
      path: url.pathname,
      ref: document.referrer || undefined,
      utm_source: url.searchParams.get("utm_source") ?? url.searchParams.get("ref") ?? undefined,
      utm_medium: url.searchParams.get("utm_medium") ?? undefined,
      utm_campaign: url.searchParams.get("utm_campaign") ?? undefined,
      screen: `${window.screen.width}x${window.screen.height}`,
      lang: navigator.language?.slice(0, 20),
      ...extra,
    });
    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/t", blob)) {
      fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(
        () => {},
      );
    }
  } catch {
    /* la medición nunca debe romper una acción de la persona */
  }
}

/** Conversiones: además de la analítica propia, a Vercel Analytics y GA4. */
export function track(event: Conversion, props: Props = {}) {
  send(event, { props });
  try {
    vercelTrack(event, props);
    (window as unknown as { gtag?: Gtag }).gtag?.("event", event, props);
  } catch {
    /* idem */
  }
}
