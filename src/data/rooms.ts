import type { RoomType } from "./types";

export type RoomMeta = {
  label: string;
  /** Default size, in metres. */
  w: number;
  h: number;
  outdoor?: boolean;
  /** Spaces where the view matters enough to ask for it. */
  view?: boolean;
  features: string[];
};

export const ROOM_TYPES: Record<RoomType, RoomMeta> = {
  sala: {
    label: "Sala",
    w: 5,
    h: 4,
    view: true,
    features: [
      "Luz natural",
      "Ventilador de techo",
      "Aire acondicionado",
      "Smart TV",
      "Sofá cama",
      "Doble altura",
    ],
  },
  comedor: {
    label: "Comedor",
    w: 3.5,
    h: 3,
    features: ["Mesa para 4", "Mesa para 6", "Mesa para 8", "Luz natural"],
  },
  cocina: {
    label: "Cocina",
    w: 3,
    h: 3,
    features: [
      "Estufa de gas",
      "Estufa de inducción",
      "Horno",
      "Refrigeradora",
      "Microondas",
      "Lavavajillas",
      "Cafetera",
    ],
  },
  dormitorio: {
    label: "Dormitorio",
    w: 3.5,
    h: 3.5,
    view: true,
    features: [
      "Cama king",
      "Cama queen",
      "Cama individual",
      "Clóset",
      "Aire acondicionado",
      "Ventilador de techo",
      "Escritorio",
      "Cortinas blackout",
      "Baño privado",
    ],
  },
  bano: {
    label: "Baño",
    w: 2,
    h: 2.5,
    features: ["Ducha", "Tina", "Agua caliente", "Doble lavamanos", "Ventana"],
  },
  estudio: {
    label: "Estudio",
    w: 3,
    h: 3,
    view: true,
    features: [
      "Escritorio",
      "Silla ergonómica",
      "Internet por cable",
      "Estantería",
      "Puerta a la calle",
    ],
  },
  terraza: {
    label: "Terraza",
    w: 4,
    h: 3,
    outdoor: true,
    view: true,
    features: ["Techada", "Comedor exterior", "Hamacas", "Parrilla", "Iluminación"],
  },
  balcon: {
    label: "Balcón",
    w: 3,
    h: 1.5,
    outdoor: true,
    view: true,
    features: ["Barandal de vidrio", "Plantas", "Mesa para 2"],
  },
  jardin: {
    label: "Jardín",
    w: 5,
    h: 4,
    outdoor: true,
    features: ["Cerrado", "Riego automático", "Árboles frutales", "Grama"],
  },
  patio: {
    label: "Patio",
    w: 4,
    h: 4,
    outdoor: true,
    features: ["Fuente", "Plantas", "Corredor techado"],
  },
  piscina: {
    label: "Piscina",
    w: 4,
    h: 7,
    outdoor: true,
    view: true,
    features: ["Climatizada", "Infinita", "Con cerco", "Iluminada"],
  },
  lavanderia: {
    label: "Lavandería",
    w: 2,
    h: 2,
    features: ["Lavadora", "Secadora", "Pila", "Tendedero"],
  },
  cochera: {
    label: "Cochera",
    w: 3,
    h: 5.5,
    outdoor: true,
    features: ["Techada", "1 vehículo", "2 vehículos", "Portón eléctrico"],
  },
  pasillo: {
    label: "Pasillo",
    w: 1.2,
    h: 4,
    features: ["Clóset de visitas"],
  },
  muelle: {
    label: "Muelle",
    w: 3,
    h: 6,
    outdoor: true,
    view: true,
    features: ["Escalera al agua", "Kayaks", "Hamaca"],
  },
  bodega: {
    label: "Bodega",
    w: 1.5,
    h: 2,
    features: ["Estantes"],
  },
};

export const ROOM_ORDER: RoomType[] = [
  "sala",
  "comedor",
  "cocina",
  "dormitorio",
  "bano",
  "estudio",
  "terraza",
  "balcon",
  "jardin",
  "patio",
  "piscina",
  "lavanderia",
  "cochera",
  "pasillo",
  "muelle",
  "bodega",
];

export const VIEW_OPTIONS = [
  "Al mar",
  "Al lago",
  "Al volcán de San Salvador",
  "A la montaña",
  "A la ciudad",
  "Al jardín",
  "A la calle",
  "Interior, sin vista",
];


export const area = (r: { w: number; h: number }) => Math.round(r.w * r.h * 100) / 100;
