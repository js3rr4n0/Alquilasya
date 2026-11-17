"use client";

import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cx } from "../lib/format";
import { send } from "../lib/track";
import { Button } from "./ui";

/**
 * «Compartir» un anuncio. En el teléfono abre el menú del sistema (WhatsApp,
 * Instagram, Messenger…); en la computadora, un menú con WhatsApp, Facebook y
 * copiar el enlace. La vista previa la pone opengraph-image del anuncio.
 */
export function ShareButton({
  url,
  title,
  text,
  listingId,
  variant = "ghost",
  size = "sm",
  className,
  label = "Compartir",
}: {
  url: string;
  title: string;
  text: string;
  listingId: string;
  variant?: "ghost" | "outline" | "primary" | "ink";
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const track = (via: string) => send("compartido", { props: { anuncio: listingId, via } });

  async function onClick() {
    // Menú nativo solo en pantallas táctiles: en la computadora es más útil el propio.
    const touch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (touch && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        track("sistema");
      } catch {
        /* la persona cerró el menú */
      }
      return;
    }
    setOpen((v) => !v);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
    setCopied(true);
    track("enlace");
    window.setTimeout(() => setCopied(false), 2000);
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const item =
    "flex w-full items-center gap-3 rounded-ctl px-3 py-2.5 text-left text-[15px] text-negro hover:bg-arena-200";

  return (
    <div ref={ref} className={cx("relative", className)}>
      <Button variant={variant} size={size} onClick={onClick} aria-expanded={open} aria-haspopup="menu">
        <Share2 className="size-4" /> {copied ? "Enlace copiado" : label}
      </Button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 rounded-card bg-crema-050 p-1.5 shadow-[0_18px_50px_-12px_rgb(10_10_10/0.35)] ring-1 ring-arena-200"
        >
          <a role="menuitem" href={wa} target="_blank" rel="noopener noreferrer" className={item} onClick={() => { track("whatsapp"); setOpen(false); }}>
            <MessageCircle className="size-4 text-[#1f9d55]" /> WhatsApp
          </a>
          <a role="menuitem" href={fb} target="_blank" rel="noopener noreferrer" className={item} onClick={() => { track("facebook"); setOpen(false); }}>
            <svg viewBox="0 0 24 24" className="size-4" fill="#1877f2" aria-hidden>
              <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
            </svg>
            Facebook
          </a>
          <button role="menuitem" type="button" className={item} onClick={copy}>
            {copied ? <Check className="size-4 text-exito" /> : <Link2 className="size-4" />}
            {copied ? "¡Copiado!" : "Copiar enlace"}
          </button>
        </div>
      )}
    </div>
  );
}
