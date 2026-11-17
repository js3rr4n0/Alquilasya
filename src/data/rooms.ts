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
  samples: string[];
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
    samples: ["salaBeige", "salaLuz", "salaChimenea"],
  },
  comedor: {
    label: "Comedor",
    w: 3.5,
    h: 3,
    features: ["Mesa para 4", "Mesa para 6", "Mesa para 8", "Luz natural"],
    samples: ["comedorSol", "comedorLamparas", "comedorModerno"],
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
    samples: ["cocinaVentanas", "cocinaIsla", "cocinaConcreto"],
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
    samples: ["dormMinimal", "dormCortinas", "camaRayas"],
  },
  bano: {
    label: "Baño",
    w: 2,
    h: 2.5,
    features: ["Ducha", "Tina", "Agua caliente", "Doble lavamanos", "Ventana"],
    samples: ["banoPiedra", "banoArco", "banoTerracota"],
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
    samples: ["oficinaLibros", "oficinaVentana", "oficinaTejados"],
  },
  terraza: {
    label: "Terraza",
    w: 4,
    h: 3,
    outdoor: true,
    view: true,
    features: ["Techada", "Comedor exterior", "Hamacas", "Parrilla", "Iluminación"],
    samples: ["patioMimbre", "terrazaMesa", "terrazaSofas"],
  },
  balcon: {
    label: "Balcón",
    w: 3,
    h: 1.5,
    outdoor: true,
    view: true,
    features: ["Barandal de vidrio", "Plantas", "Mesa para 2"],
    samples: ["balconNoche", "azoteaBahia"],
  },
  jardin: {
    label: "Jardín",
    w: 5,
    h: 4,
    outdoor: true,
    features: ["Cerrado", "Riego automático", "Árboles frutales", "Grama"],
    samples: ["jardinBananos", "jardinTropical"],
  },
  patio: {
    label: "Patio",
    w: 4,
    h: 4,
    outdoor: true,
    features: ["Fuente", "Plantas", "Corredor techado"],
    samples: ["claustroPalmas", "claustroRojo", "patioPlantas"],
  },
  piscina: {
    label: "Piscina",
    w: 4,
    h: 7,
    outdoor: true,
    view: true,
    features: ["Climatizada", "Infinita", "Con cerco", "Iluminada"],
    samples: ["piscinaInfinita", "piscinaPalmeras"],
  },
  lavanderia: {
    label: "Lavandería",
    w: 2,
    h: 2,
    features: ["Lavadora", "Secadora", "Pila", "Tendedero"],
    samples: ["cocinaMadera"],
  },
  cochera: {
    label: "Cochera",
    w: 3,
    h: 5.5,
    outdoor: true,
    features: ["Techada", "1 vehículo", "2 vehículos", "Portón eléctrico"],
    samples: ["casaTropicalAutos"],
  },
  pasillo: {
    label: "Pasillo",
    w: 1.2,
    h: 4,
    features: ["Clóset de visitas"],
    samples: ["puertaLuz", "puertaMadera"],
  },
  muelle: {
    label: "Muelle",
    w: 3,
    h: 6,
    outdoor: true,
    view: true,
    features: ["Escalera al agua", "Kayaks", "Hamaca"],
    samples: ["coatepequeMuelle", "coatepequeNiebla"],
  },
  bodega: {
    label: "Bodega",
    w: 1.5,
    h: 2,
    features: ["Estantes"],
    samples: ["cocinaMadera"],
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

/** Photos that can stand in for a view, keyed by the view label. */
export const VIEW_SAMPLES: Record<string, string> = {
  "Al mar": "tuncoAtardecer",
  "Al lago": "lagoVolcanes",
  "Al volcán de San Salvador": "volcanNoche",
  "A la montaña": "deckLago",
  "A la ciudad": "volcanAtardecer",
  "Al jardín": "jardinTropical",
  "A la calle": "suchitotoCalle",
};

export const area = (r: { w: number; h: number }) => Math.round(r.w * r.h * 100) / 100;
