"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { send } from "@/lib/track";

/**
 * Registra cada página vista y, al salir de ella, cuánto tiempo estuvo visible.
 * No mide la sala de administración.
 */
export function PageTracker() {
  const pathname = usePathname() ?? "/";
  const visibleSince = useRef<number | null>(null);
  const visibleMs = useRef(0);
  const current = useRef<string | null>(null);

  useEffect(() => {
    const flush = () => {
      if (visibleSince.current !== null) {
        visibleMs.current += Date.now() - visibleSince.current;
        visibleSince.current = Date.now();
      }
      const ms = Math.round(visibleMs.current);
      if (current.current && ms >= 1000) send("tiempo", { dur: ms });
      visibleMs.current = 0;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
        visibleSince.current = null;
      } else {
        visibleSince.current = Date.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    // Al cambiar de página dentro del sitio se cierra el tiempo de la anterior.
    if (current.current && current.current !== pathname && visibleSince.current !== null) {
      const ms = Math.round(visibleMs.current + Date.now() - visibleSince.current);
      if (ms >= 1000) {
        // El tiempo pertenece a la página anterior: se envía antes de que cambie la URL medida.
        send("tiempo", { dur: ms, props: { pagina: current.current } });
      }
    }
    current.current = pathname;
    visibleMs.current = 0;
    visibleSince.current = document.visibilityState === "visible" ? Date.now() : null;
    send("pagina");
  }, [pathname]);

  return null;
}
