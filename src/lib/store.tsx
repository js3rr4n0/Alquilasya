"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Listing } from "../data/types";
import type { DurationKey } from "./durations";
import { isoDay } from "./format";

export type Account = {
  id: string;
  email: string;
  name: string;
  whatsapp: string | null;
  verified: boolean;
  admin: boolean;
};

/** Preferencias de búsqueda y favoritos: viven en este navegador. */
type Persisted = {
  duration: DurationKey;
  start: string;
  /** "" (todo el país), "dep:05" o "dis:3584256". Ver `lib/geo`. */
  zone: string;
  favorites: string[];
};

const KEY = "alquilasya.v4";

function firstOfNextMonth() {
  const d = new Date();
  return isoDay(new Date(d.getFullYear(), d.getMonth() + 1, 1));
}

function defaults(): Persisted {
  return { duration: "mes", start: firstOfNextMonth(), zone: "", favorites: [] };
}

function load(): Persisted {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...base, ...(JSON.parse(raw) as Partial<Persisted>) } : base;
  } catch {
    return base;
  }
}

type Store = Persisted & {
  /** Cuenta con la que se entró, o null. `authLoaded` avisa cuándo ya se sabe. */
  user: Account | null;
  authLoaded: boolean;
  /** Mensajes del chat sin leer. */
  unread: number;
  setUser: (user: Account | null) => void;
  refreshMe: () => Promise<void>;
  logout: () => Promise<void>;
  setDuration: (d: DurationKey) => void;
  setStart: (iso: string) => void;
  setZone: (z: string) => void;
  toggleFavorite: (id: string) => void;
  /** Busca un anuncio en el servidor (los que están en revisión solo se entregan a su dueño). */
  fetchListing: (id: string) => Promise<Listing | null>;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  // El servidor y el primer render comparten los valores por defecto; lo guardado llega al montar.
  const [state, setState] = useState<Persisted>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState<Account | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado: la sesión sigue en memoria */
    }
  }, [state, hydrated]);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = (await res.json()) as { user: Account | null; unread?: number };
      const next = data.user ?? null;
      setUser((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
      setUnread(data.unread ?? 0);
    } catch {
      /* sin red: se conserva lo que había */
    } finally {
      setAuthLoaded(true);
    }
  }, []);

  // Al entrar, al volver a la pestaña y cada minuto: quién soy y si hay mensajes nuevos.
  useEffect(() => {
    refreshMe();
    const onVisible = () => document.visibilityState === "visible" && refreshMe();
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(onVisible, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, [refreshMe]);

  const fetchListing = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const { listing } = (await res.json()) as { listing: Listing };
      return listing;
    } catch {
      return null;
    }
  }, []);

  const store: Store = {
    ...state,
    user,
    authLoaded,
    unread,
    setUser,
    refreshMe,
    logout: async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      setUser(null);
      setUnread(0);
    },
    setDuration: (duration) => setState((s) => ({ ...s, duration })),
    setStart: (start) => setState((s) => ({ ...s, start })),
    setZone: (zone) => setState((s) => ({ ...s, zone })),
    toggleFavorite: (id) =>
      setState((s) => ({
        ...s,
        favorites: s.favorites.includes(id)
          ? s.favorites.filter((f) => f !== id)
          : [...s.favorites, id],
      })),
    fetchListing,
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}

/**
 * Un anuncio por id. Los publicados se resuelven al instante;
 * uno en revisión se pide al servidor, que solo lo entrega a su dueño.
 */
export function useListing(id: string | undefined, initial?: Listing) {
  const { fetchListing, user } = useStore();
  const [fetched, setFetched] = useState<Listing | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const found = (fetched?.id === id ? fetched : undefined) ?? (initial?.id === id ? initial : undefined);

  // El servidor ya manda la ficha en el HTML; solo se pide aquí si no llegó
  // (por ejemplo, un anuncio en revisión que se ve tras iniciar sesión).
  useEffect(() => {
    if (!id || found) return;
    let alive = true;
    fetchListing(id).then((l) => {
      if (!alive) return;
      if (l) setFetched(l);
      else setMissing(id);
    });
    return () => {
      alive = false;
    };
  }, [id, found, fetchListing, user?.id]);

  return { listing: found, loading: !found && missing !== id };
}
