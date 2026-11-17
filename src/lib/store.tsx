"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LISTINGS } from "../data/listings";
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

const EXAMPLES: Listing[] = LISTINGS.map((l) => ({ ...l, example: true }));

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
  /** Anuncios publicados (vienen de la base de datos). */
  listings: Listing[];
  /** Casas ilustrativas para explicar el producto; nunca se mezclan con los resultados. */
  examples: Listing[];
  /** False hasta que se pidieron los anuncios al servidor. */
  loaded: boolean;
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

const isPublic = (l: Listing) => !l.status || l.status === "publicada";

export function StoreProvider({ children }: { children: ReactNode }) {
  // El servidor y el primer render comparten los valores por defecto; lo guardado llega al montar.
  const [state, setState] = useState<Persisted>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [remote, setRemote] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
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

  useEffect(() => {
    let alive = true;
    fetch("/api/listings")
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((d: { listings?: Listing[] }) => {
        if (!alive) return;
        setRemote((current) => {
          const fresh = d.listings ?? [];
          const ids = new Set(fresh.map((l) => l.id));
          return [...current.filter((l) => !ids.has(l.id)), ...fresh];
        });
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const listings = useMemo(() => remote.filter(isPublic), [remote]);
  const allRef = useRef<Listing[]>([]);
  allRef.current = [...remote, ...EXAMPLES];

  const fetchListing = useCallback(async (id: string) => {
    const known = allRef.current.find((l) => l.id === id);
    if (known) return known;
    try {
      const res = await fetch(`/api/listings/${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const { listing } = (await res.json()) as { listing: Listing };
      setRemote((current) => [listing, ...current.filter((l) => l.id !== listing.id)]);
      return listing;
    } catch {
      return null;
    }
  }, []);

  const store: Store = {
    ...state,
    listings,
    examples: EXAMPLES,
    loaded,
    user,
    authLoaded,
    unread,
    setUser,
    refreshMe,
    logout: async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      setUser(null);
      setUnread(0);
      // Los anuncios en revisión que solo veía su dueño salen de la memoria.
      setRemote((current) => current.filter(isPublic));
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
 * Un anuncio por id. Los publicados y los ejemplos se resuelven al instante;
 * uno en revisión se pide al servidor, que solo lo entrega a su dueño.
 */
export function useListing(id: string | undefined, initial?: Listing) {
  const { listings, examples, loaded, fetchListing } = useStore();
  const [fetched, setFetched] = useState<Listing | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const found =
    listings.find((l) => l.id === id) ??
    examples.find((l) => l.id === id) ??
    (fetched?.id === id ? fetched : undefined) ??
    (initial?.id === id ? initial : undefined);

  useEffect(() => {
    if (!id || found || !loaded) return;
    let alive = true;
    fetchListing(id).then((l) => {
      if (!alive) return;
      if (l) setFetched(l);
      else setMissing(id);
    });
    return () => {
      alive = false;
    };
  }, [id, found, loaded, fetchListing]);

  return { listing: found, loading: !found && missing !== id };
}
