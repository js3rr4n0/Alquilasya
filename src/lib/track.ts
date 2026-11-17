"use client";

import { track as vercelTrack } from "@vercel/analytics";

/**
 * Conversiones del sitio. Van a Vercel Analytics y, si está configurado
 * Google Analytics (NEXT_PUBLIC_GA_ID), también como eventos de GA4, que se
 * pueden marcar como «eventos clave» e importar a Google Ads.
 */
export type Conversion =
  | "cuenta_creada"
  | "correo_verificado"
  | "anuncio_enviado"
  | "anuncio_editado"
  | "mensaje_enviado"
  | "lista_espera";

type Gtag = (command: "event", name: string, params?: Record<string, string>) => void;

export function track(event: Conversion, props: Record<string, string> = {}) {
  try {
    vercelTrack(event, props);
    (window as unknown as { gtag?: Gtag }).gtag?.("event", event, props);
  } catch {
    /* la medición nunca debe romper una acción de la persona */
  }
}
