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
  /** Moderation state for listings stored in the database. */
  status?: ListingStatus;
  /** Territorial division for real listings (zone = district, region = department). */
  districtId?: number;
  municipality?: string;
  colonia?: string;
  /** Public name of whoever published a real listing. */
  contactName?: string;
  /** Lo que se sabe de verdad de quien publica, sacado de su cuenta (HU-04). */
  host?: Host;
  /** Solo para su dueño: por qué está en revisión y dónde se corrige cada cosa. */
  review?: ListingReview;
};

export type Host = {
  /** Cuándo creó su cuenta (ISO). */
  since: string;
  /** Confirmó su correo con un código. */
  verified: boolean;
  /** Se registró antes del 1 de enero de 2027. */
  founder: boolean;
  /** Anuncios publicados ahora mismo. */
  listings: number;
};

/** Paso del formulario de publicar donde se corrige algo. */
export type FixStep = "datos" | "plano" | "condiciones" | "precios";

export type ListingReview = {
  /** Motivo tal como quedó guardado. */
  reason: string;
  /** Lo reportó alguien: lo revisa una persona, editar no lo publica solo. */
  reported: boolean;
  /** Cada motivo con el paso y el campo exactos donde se corrige. */
  issues: { reason: string; step: FixStep; field: string; where: string }[];
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

/** Lo que necesita una tarjeta de resultados: sin plano ni textos largos. */
export type ListingSummary = Pick<
  Listing,
  | "id"
  | "title"
  | "type"
  | "zone"
  | "region"
  | "bedrooms"
  | "bathrooms"
  | "area"
  | "lat"
  | "lng"
  | "cover"
  | "prices"
  | "conditions"
  | "publishedAt"
> &
  Partial<Pick<Listing, "promoted" | "isNew">>;

/** Un punto del mapa de resultados. `prices` solo trae el plazo buscado. */
export type MapPoint = Pick<Listing, "id" | "title" | "lat" | "lng" | "prices">;
