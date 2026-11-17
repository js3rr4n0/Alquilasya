import type { DurationKey } from "../lib/durations";

export type RoomType =
  | "sala"
  | "comedor"
  | "cocina"
  | "dormitorio"
  | "bano"
  | "estudio"
  | "terraza"
  | "balcon"
  | "jardin"
  | "patio"
  | "piscina"
  | "lavanderia"
  | "cochera"
  | "pasillo"
  | "muelle"
  | "bodega";

/** A space on the plan. Coordinates and sizes are in metres. */
export type Room = {
  id: string;
  type: RoomType;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  photos: string[];
  features?: string[];
  view?: { label: string; photo?: string };
  note?: string;
};

export type Floor = {
  id: string;
  name: string;
  width: number;
  height: number;
  rooms: Room[];
};

export type ConditionKey =
  | "amueblado"
  | "mascotas"
  | "invitados"
  | "fumar"
  | "negocio"
  | "eventos"
  | "ninos"
  | "silencio"
  | "estacionamiento"
  | "accesibilidad"
  | "subarriendo";

export type ConditionStatus = "si" | "parcial" | "no";

export type Condition = {
  key: ConditionKey;
  status: ConditionStatus;
  value: string;
  detail?: string;
};

export type Included = { label: string; included: boolean; note?: string };

export type Review = {
  author: string;
  date: string;
  duration: DurationKey;
  text: string;
  score: number;
  fidelity: number;
};

export type PropertyType = "Casa" | "Apartamento" | "Loft" | "Cabaña" | "Estudio" | "Penthouse";

export type Listing = {
  id: string;
  title: string;
  type: PropertyType;
  zone: string;
  region: string;
  lat: number;
  lng: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  lot?: number;
  cover: string;
  summary: string;
  description: string;
  prices: Partial<Record<DurationKey, number>>;
  deposit: number;
  depositShort?: number;
  includes: Included[];
  conditions: Condition[];
  rules: string[];
  floors: Floor[];
  ownerId: string;
  verified: { identity: boolean; deed: boolean; visit?: string };
  rating: { score: number; count: number; fidelity: number };
  reviews: Review[];
  promoted?: boolean;
  instantApproval?: boolean;
  availableFrom: string;
  publishedAt: string;
  nearby: { label: string; value: string }[];
  booked?: [string, string][];
  /** Published from this browser (kept so the owner can find it again). */
  isNew?: boolean;
  /** Illustrative listing shipped with the site, not a real property. */
  example?: boolean;
  /** Moderation state for listings stored in the database. */
  status?: ListingStatus;
  /** Public name of whoever published a real listing. */
  contactName?: string;
};

export type ListingStatus = "pendiente" | "publicada" | "rechazada" | "pausada";

export type Person = {
  id: string;
  name: string;
  photo?: string;
  initials?: string;
  kind: "persona" | "empresa";
  since: number;
  responseTime: string;
  rating: number;
  rentals: number;
  verified: string[];
  languages: string[];
  bio: string;
};

export type MessageKind = "text" | "expediente" | "system";

export type Message = {
  id: string;
  from: "me" | "them" | "system";
  kind: MessageKind;
  text: string;
  at: string;
  /** Whether the sender was in reserved mode when it was sent. */
  reserved?: boolean;
};

export type Conversation = {
  id: string;
  listingId: string;
  ownerId: string;
  reserved: boolean;
  keyVerified: boolean;
  disappearing: "Nunca" | "30 días" | "7 días" | "24 horas";
  unread: number;
  expedienteShared: boolean;
  messages: Message[];
};
