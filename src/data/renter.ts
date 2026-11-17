export const RENTER = {
  id: "daniela",
  name: "Daniela Rivas",
  firstName: "Daniela",
  photo: "daniela",
  memberSince: 2024,
  verifiedAt: "3 nov 2026",
  headline: "Diseñadora de producto. Busco casa con jardín para Luna y para mí.",
  household: {
    summary: "2 adultos · 1 perra",
    people: [
      { name: "Daniela Rivas", note: "Titular del contrato" },
      { name: "Javier Cruz", note: "Pareja · cocinero" },
    ],
    pets: [
      {
        name: "Luna",
        kind: "Labradora",
        weight: "28 kg",
        note: "Vacunas al día · esterilizada · 4 años",
      },
    ],
  },
  identity: {
    doc: "DUI",
    masked: "0•••••21-7",
    method: "Documento + validación biométrica",
    date: "3 nov 2026",
  },
  work: {
    role: "Diseñadora de producto sénior",
    company: "Northwind Labs",
    mode: "Remoto para EE. UU.",
    since: "mar 2021",
    tenure: "5 años y 8 meses",
    verifiedBy: "Constancia laboral y llamada a Recursos Humanos",
  },
  income: {
    monthly: 3400,
    range: [3000, 3500] as [number, number],
    source: "Planilla · promedio de los últimos 6 meses",
    verifiedBy: "Estados de cuenta conectados en modo de solo lectura",
  },
  history: [
    {
      place: "Apartamento en Colonia Escalón",
      owner: "Marta Aguilar",
      period: "ene 2023 – oct 2026",
      length: "3 años y 10 meses",
      payments: "46 de 46 a tiempo",
      score: 5,
      quote: "Pagó siempre el día 1 y dejó el apartamento mejor de como lo recibió.",
    },
    {
      place: "Habitación en Antiguo Cuscatlán",
      owner: "Familia Durán",
      period: "feb 2020 – dic 2022",
      length: "2 años y 11 meses",
      payments: "35 de 35 a tiempo",
      score: 4.8,
      quote: "Ordenada y tranquila. La volveríamos a recibir.",
    },
    {
      place: "Casa de playa en El Zonte",
      owner: "Óscar Valle",
      period: "abr 2025",
      length: "1 semana",
      payments: "Pagado por adelantado",
      score: 5,
      quote: "Dejó todo limpio y nos avisó de una fuga que no habíamos visto.",
    },
  ],
  references: [
    {
      name: "Marta Aguilar",
      relation: "Propietaria anterior · 3 años y 10 meses",
      check: "Llamada verificada el 2 nov 2026",
    },
    {
      name: "Karla Méndez",
      relation: "Jefa directa en Northwind Labs",
      check: "Correo corporativo verificado",
    },
    {
      name: "Óscar Valle",
      relation: "Propietario · alquiler de una semana",
      check: "Calificación dentro de AlquilasYa",
    },
  ],
  ratings: {
    score: 4.9,
    count: 3,
    categories: [
      { label: "Pago puntual", score: 5 },
      { label: "Cuidado del lugar", score: 4.9 },
      { label: "Comunicación", score: 5 },
      { label: "Convivencia con vecinos", score: 4.8 },
    ],
  },
  documents: [
    { label: "DUI, ambas caras", status: "ok" as const, note: "Verificado el 3 nov 2026" },
    { label: "Selfie de validación", status: "ok" as const, note: "Coincidencia biométrica" },
    { label: "Constancia laboral", status: "ok" as const, note: "Emitida el 28 oct 2026" },
    {
      label: "Estados de cuenta, 6 meses",
      status: "ok" as const,
      note: "Conexión de solo lectura",
    },
    { label: "Solvencia de la PNC", status: "warn" as const, note: "Caduca en 20 días" },
    { label: "Carné de vacunas de Luna", status: "ok" as const, note: "Al día hasta mar 2027" },
  ],
  checks: [
    "Identidad",
    "Validación biométrica",
    "Empleo",
    "Antigüedad laboral",
    "Ingresos",
    "Pagos de alquiler anteriores",
    "Referencias de propietarios",
    "Antecedentes",
    "Mascota",
  ],
};

export type Privacy = {
  incomeAsRange: boolean;
  showCompany: boolean;
  directReferences: boolean;
  shareOnApply: boolean;
  showHousehold: boolean;
};

export const DEFAULT_PRIVACY: Privacy = {
  incomeAsRange: true,
  showCompany: true,
  directReferences: false,
  shareOnApply: true,
  showHousehold: true,
};
