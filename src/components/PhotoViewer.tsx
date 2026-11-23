"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { photoUrl } from "../lib/photos";

export type ViewerPhoto = { src: string; caption: string };

/**
 * Visor de fotos a pantalla completa: la foto entera (nunca recortada), se desliza
 * con el dedo o con flechas, admite zoom con dos dedos y dice de qué espacio es.
 */
export function PhotoViewer({
  photos,
  start,
  onClose,
  title,
}: {
  photos: ViewerPhoto[];
  /** Índice de la foto con la que se abre. */
  start: number;
  onClose: () => void;
  title: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = track.current;
      if (!el) return;
      const next = Math.max(0, Math.min(photos.length - 1, i));
      el.scrollTo({ left: next * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
    },
    [photos.length],
  );

  // Abre en la foto tocada y bloquea el desplazamiento de la página mientras está abierto.
  useEffect(() => {
    goTo(start, false);
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [start, goTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, goTo, onClose]);

  const current = photos[index];

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Fotos de ${title}`} className="fixed inset-0 z-[2000] flex flex-col bg-negro text-crema-100">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 text-[15px]">
          <span className="font-semibold tabular-nums">
            {index + 1}/{photos.length}
          </span>
          {current && <span className="ml-2 truncate text-piedra-300">{current.caption}</span>}
        </p>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          aria-label="Cerrar"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-ctl hover:bg-crema-100/10"
        >
          <X className="size-6" />
        </button>
      </div>

      <div
        ref={track}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
          if (i !== index) setIndex(i);
        }}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden no-scrollbar"
      >
        {photos.map((p, i) => (
          <figure key={`${p.src}-${i}`} className="flex h-full w-full shrink-0 snap-center items-center justify-center px-2 pb-4 sm:px-16">
            <img
              src={photoUrl(p.src, 1800)}
              alt={p.caption}
              loading={Math.abs(i - start) <= 1 ? "eager" : "lazy"}
              className="max-h-full max-w-full object-contain"
              // Deslizar entre fotos y acercar con dos dedos.
              style={{ touchAction: "pan-x pinch-zoom" }}
              draggable={false}
            />
          </figure>
        ))}
      </div>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-crema-100/10 hover:bg-crema-100/20 disabled:opacity-30 sm:inline-flex"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === photos.length - 1}
            aria-label="Foto siguiente"
            className="absolute right-3 top-1/2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-crema-100/10 hover:bg-crema-100/20 disabled:opacity-30 sm:inline-flex"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
