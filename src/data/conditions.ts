import type { ConditionKey, ConditionStatus } from "./types";

export type ConditionMeta = {
  label: string;
  question: string;
  /** Wording of each status in the owner's form. */
  options: Record<ConditionStatus, string>;
  /** Default sentence when the owner picks a status without writing more. */
  defaults: Record<ConditionStatus, string>;
};

export const CONDITIONS: Record<ConditionKey, ConditionMeta> = {
  amueblado: {
    label: "Amueblado",
    question: "¿Viene amueblado?",
    options: { si: "Amueblado", parcial: "Semiamueblado", no: "Sin amueblar" },
    defaults: { si: "Amueblado", parcial: "Semiamueblado", no: "Sin amueblar" },
  },
  mascotas: {
    label: "Mascotas",
    question: "¿Aceptas mascotas?",
    options: { si: "Sí", parcial: "Con condiciones", no: "No" },
    defaults: { si: "Sí", parcial: "Con condiciones", no: "No" },
  },
  invitados: {
    label: "Invitados",
    question: "¿Pueden quedarse invitados a dormir?",
    options: { si: "Sí", parcial: "Con límite", no: "No" },
    defaults: { si: "Sí", parcial: "Con límite", no: "No" },
  },
  fumar: {
    label: "Fumar",
    question: "¿Se puede fumar?",
    options: { si: "Sí", parcial: "Solo exteriores", no: "No" },
    defaults: { si: "Sí", parcial: "Solo exteriores", no: "No" },
  },
  negocio: {
    label: "Uso comercial",
    question: "¿Se puede trabajar o tener un negocio?",
    options: { si: "Sí, con clientes", parcial: "Oficina en casa", no: "Solo vivienda" },
    defaults: { si: "Sí, con clientes", parcial: "Oficina en casa", no: "No" },
  },
  eventos: {
    label: "Fiestas y eventos",
    question: "¿Se permiten reuniones o fiestas?",
    options: { si: "Sí", parcial: "Reuniones pequeñas", no: "No" },
    defaults: { si: "Sí", parcial: "Reuniones pequeñas", no: "No" },
  },
  ninos: {
    label: "Niños",
    question: "¿Es apta para niños?",
    options: { si: "Sí", parcial: "Con supervisión", no: "No ideal" },
    defaults: { si: "Sí", parcial: "Con supervisión", no: "No ideal" },
  },
  silencio: {
    label: "Horas de silencio",
    question: "¿Hay horario de silencio?",
    options: { si: "Sin horario", parcial: "Con horario", no: "Estricto" },
    defaults: { si: "Sin horario", parcial: "22:00 – 7:00", no: "21:00 – 8:00" },
  },
  estacionamiento: {
    label: "Estacionamiento",
    question: "¿Hay estacionamiento?",
    options: { si: "Sí", parcial: "En la calle", no: "No" },
    defaults: { si: "1 vehículo", parcial: "En la calle", no: "No" },
  },
  accesibilidad: {
    label: "Accesibilidad",
    question: "¿Se puede llegar sin escalones?",
    options: { si: "Sí", parcial: "En parte", no: "No" },
    defaults: { si: "Sin escalones", parcial: "En parte", no: "Con escaleras" },
  },
  subarriendo: {
    label: "Subarrendar",
    question: "¿Se puede subarrendar?",
    options: { si: "Sí", parcial: "Con permiso", no: "No" },
    defaults: { si: "Sí", parcial: "Con permiso", no: "No" },
  },
};

export const CONDITION_ORDER: ConditionKey[] = [
  "amueblado",
  "mascotas",
  "invitados",
  "fumar",
  "negocio",
  "eventos",
  "ninos",
  "silencio",
  "estacionamiento",
  "accesibilidad",
  "subarriendo",
];

/** Filters exposed to renters in Explore. */
export const CONDITION_FILTERS: { key: ConditionKey; label: string; accept: ConditionStatus[] }[] =
  [
    { key: "amueblado", label: "Amueblado", accept: ["si"] },
    { key: "mascotas", label: "Acepta mascotas", accept: ["si", "parcial"] },
    { key: "invitados", label: "Invitados a dormir", accept: ["si", "parcial"] },
    { key: "fumar", label: "Se puede fumar", accept: ["si", "parcial"] },
    { key: "negocio", label: "Trabajar o negocio", accept: ["si", "parcial"] },
    { key: "eventos", label: "Reuniones", accept: ["si", "parcial"] },
    { key: "ninos", label: "Apta para niños", accept: ["si"] },
  ];
