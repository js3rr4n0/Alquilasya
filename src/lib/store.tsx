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
import { SEED_CONVERSATIONS } from "../data/conversations";
import { LISTINGS } from "../data/listings";
import { DEFAULT_PRIVACY, type Privacy } from "../data/renter";
import type { Conversation, Listing, Message } from "../data/types";
import type { DurationKey } from "./durations";
import { isoDay } from "./format";
import { replyFor } from "./replies";

export type Account = { id: string; email: string; name: string; whatsapp: string | null };

type Persisted = {
  duration: DurationKey;
  start: string;
  zone: string;
  favorites: string[];
  conversations: Conversation[];
  privacy: Privacy;
};

const KEY = "alquilasya.v3";

const EXAMPLES: Listing[] = LISTINGS.map((l) => ({ ...l, example: true }));

function firstOfNextMonth() {
  const d = new Date();
  return isoDay(new Date(d.getFullYear(), d.getMonth() + 1, 1));
}

function defaults(): Persisted {
  return {
    duration: "mes",
    start: firstOfNextMonth(),
    zone: "",
    favorites: [],
    conversations: SEED_CONVERSATIONS,
    privacy: DEFAULT_PRIVACY,
  };
}

function load(): Persisted {
  const base = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Persisted>;
    return { ...base, ...saved, privacy: { ...base.privacy, ...saved.privacy } };
  } catch {
    return base;
  }
}

type Store = Persisted & {
  listings: Listing[];
  /** Illustrative listings used to explain the product; never mixed into results. */
  examples: Listing[];
  /** Signed-in account, or null. `authLoaded` turns true once that is known. */
  user: Account | null;
  authLoaded: boolean;
  setUser: (user: Account | null) => void;
  logout: () => Promise<void>;
  /** False until the real listings have been requested from the server. */
  loaded: boolean;
  typing: Record<string, boolean>;
  setDuration: (d: DurationKey) => void;
  setStart: (iso: string) => void;
  setZone: (z: string) => void;
  toggleFavorite: (id: string) => void;
  /** Looks a listing up on the server (pending ones are only served to their owner). */
  fetchListing: (id: string) => Promise<Listing | null>;
  setPrivacy: (patch: Partial<Privacy>) => void;
  sendMessage: (conversationId: string, text: string) => void;
  shareExpediente: (conversationId: string) => void;
  setReserved: (conversationId: string, reserved: boolean) => void;
  verifyKey: (conversationId: string) => void;
  setDisappearing: (conversationId: string, value: Conversation["disappearing"]) => void;
  markRead: (conversationId: string) => void;
  openConversation: (listingId: string) => string;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

let msgSeq = 0;
const newId = () => `n${Date.now().toString(36)}${(msgSeq++).toString(36)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  // Server and first client render share the defaults; saved state arrives after mount.
  const [state, setState] = useState<Persisted>(defaults);
  const [hydrated, setHydrated] = useState(false);
  const [remote, setRemote] = useState<Listing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [user, setUser] = useState<Account | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [typing, setTyping] = useState<Record<string, boolean>>({});
  const timers = useRef<number[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or unavailable: the session still works in memory */
    }
  }, [state, hydrated]);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: Account | null }) => alive && setUser(d.user ?? null))
      .catch(() => {})
      .finally(() => alive && setAuthLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

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

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Only published listings from the database; pending ones fetched for their owner stay out.
  const listings = useMemo(
    () => remote.filter((l) => !l.status || l.status === "publicada"),
    [remote],
  );
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

  const patchConversation = useCallback((id: string, fn: (c: Conversation) => Conversation) => {
    setState((s) => ({
      ...s,
      conversations: s.conversations.map((c) => (c.id === id ? fn(c) : c)),
    }));
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const ownerReplies = useCallback(
    (conversationId: string, text: (listing: Listing) => string, delay = 1400) => {
      later(() => setTyping((t) => ({ ...t, [conversationId]: true })), 500);
      later(() => {
        const conv = stateRef.current.conversations.find((c) => c.id === conversationId);
        const listing = allRef.current.find((l) => l.id === conv?.listingId);
        setTyping((t) => ({ ...t, [conversationId]: false }));
        if (!conv || !listing) return;
        const reply: Message = {
          id: newId(),
          from: "them",
          kind: "text",
          text: text(listing),
          at: new Date().toISOString(),
        };
        patchConversation(conversationId, (c) => ({ ...c, messages: [...c.messages, reply] }));
      }, 500 + delay);
    },
    [later, patchConversation],
  );

  const store: Store = {
    ...state,
    listings,
    examples: EXAMPLES,
    user,
    authLoaded,
    setUser,
    logout: async () => {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      setUser(null);
      // Anuncios en revisión que solo veía su dueño dejan de estar en memoria.
      setRemote((current) => current.filter((l) => !l.status || l.status === "publicada"));
    },
    loaded,
    typing,
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
    setPrivacy: (patch) => setState((s) => ({ ...s, privacy: { ...s.privacy, ...patch } })),
    sendMessage: (conversationId, text) => {
      const body = text.trim();
      if (!body) return;
      patchConversation(conversationId, (c) => ({
        ...c,
        messages: [
          ...c.messages,
          {
            id: newId(),
            from: "me",
            kind: "text",
            text: body,
            at: new Date().toISOString(),
            reserved: c.reserved,
          },
        ],
      }));
      ownerReplies(
        conversationId,
        (listing) => replyFor(listing, body),
        900 + Math.min(body.length * 18, 1600),
      );
    },
    shareExpediente: (conversationId) => {
      patchConversation(conversationId, (c) => ({
        ...c,
        reserved: false,
        expedienteShared: true,
        messages: [
          ...c.messages,
          {
            id: newId(),
            from: "system",
            kind: "system",
            text: "Saliste del modo reservado. El propietario ahora ve tu nombre y tu perfil durante 14 días.",
            at: new Date().toISOString(),
          },
          {
            id: newId(),
            from: "me",
            kind: "expediente",
            text: "Expediente compartido",
            at: new Date().toISOString(),
          },
        ],
      }));
      ownerReplies(
        conversationId,
        (listing) =>
          `Gracias, Daniela. Ya vi tu perfil. Si quieres, coordinamos una visita a ${listing.title} esta semana.`,
        1800,
      );
    },
    setReserved: (conversationId, reserved) =>
      patchConversation(conversationId, (c) => ({
        ...c,
        reserved,
        messages: [
          ...c.messages,
          {
            id: newId(),
            from: "system",
            kind: "system",
            text: reserved
              ? "Volviste al modo reservado. Tus próximos mensajes salen sin nombre ni foto."
              : "Saliste del modo reservado. El propietario ve tu nombre y tu foto; tu expediente sigue privado.",
            at: new Date().toISOString(),
          },
        ],
      })),
    verifyKey: (conversationId) =>
      patchConversation(conversationId, (c) => ({ ...c, keyVerified: true })),
    setDisappearing: (conversationId, value) =>
      patchConversation(conversationId, (c) => ({
        ...c,
        disappearing: value,
        messages: [
          ...c.messages,
          {
            id: newId(),
            from: "system",
            kind: "system",
            text:
              value === "Nunca"
                ? "Los mensajes ya no se borran solos."
                : `Los mensajes nuevos se borran a los ${value}.`,
            at: new Date().toISOString(),
          },
        ],
      })),
    markRead: (conversationId) =>
      patchConversation(conversationId, (c) => (c.unread ? { ...c, unread: 0 } : c)),
    openConversation: (listingId) => {
      const existing = stateRef.current.conversations.find((c) => c.listingId === listingId);
      if (existing) return existing.id;
      const listing = allRef.current.find((l) => l.id === listingId);
      const id = `c-${listingId}`;
      const conv: Conversation = {
        id,
        listingId,
        ownerId: listing?.ownerId ?? "andres",
        reserved: true,
        keyVerified: false,
        disappearing: "Nunca",
        unread: 0,
        expedienteShared: false,
        messages: [
          {
            id: newId(),
            from: "system",
            kind: "system",
            text: "Mensajes privados. Empiezas en modo reservado: el propietario no ve tu nombre ni tu foto.",
            at: new Date().toISOString(),
          },
        ],
      };
      setState((s) => ({ ...s, conversations: [conv, ...s.conversations] }));
      return id;
    },
    reset: () => {
      localStorage.removeItem(KEY);
      setState(defaults());
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}

/**
 * A listing by id. Examples and published listings resolve at once; a listing
 * still in review is fetched with the token kept by whoever published it.
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
