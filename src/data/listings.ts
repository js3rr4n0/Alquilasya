import type {
  Condition,
  ConditionKey,
  ConditionStatus,
  Floor,
  Listing,
  Room,
  RoomType,
} from "./types";

let seq = 0;
function r(
  type: RoomType,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  photos: string[],
  extra: Partial<Pick<Room, "features" | "view" | "note">> = {},
): Room {
  seq += 1;
  return { id: `r${seq}`, type, name, x, y, w, h, photos, ...extra };
}

function c(key: ConditionKey, status: ConditionStatus, value: string, detail?: string): Condition {
  return { key, status, value, detail };
}

function floor(id: string, name: string, width: number, height: number, rooms: Room[]): Floor {
  return { id, name, width, height, rooms };
}

export const LISTINGS: Listing[] = [
  {
    id: "casa-los-naranjos",
    title: "Casa Los Naranjos",
    type: "Casa",
    zone: "Santa Tecla",
    region: "La Libertad",
    lat: 13.6769,
    lng: -89.2797,
    bedrooms: 3,
    bathrooms: 2,
    area: 150,
    lot: 263,
    cover: "entradaPiedra",
    summary: "Una planta, jardín cerrado con tres naranjos y terraza mirando al volcán.",
    description:
      "Casa de una sola planta en una colonia tranquila, a seis minutos a pie del supermercado. La sala tiene doble altura y abre completa a la terraza; desde ahí se ve el volcán de San Salvador. El estudio tiene internet por cable y puede ser tercer dormitorio.",
    prices: { semana: 520, mes: 1250, seis: 1150, anio: 1050 },
    deposit: 1050,
    depositShort: 150,
    includes: [
      { label: "Agua", included: true },
      { label: "Luz", included: true, note: "Hasta 300 kWh al mes" },
      { label: "Internet de 200 Mb", included: true },
      { label: "Gas", included: true },
      { label: "Jardinería quincenal", included: true },
      { label: "Vigilancia de la colonia", included: true },
      { label: "Limpieza", included: false, note: "Opcional: $60 al mes, dos veces por semana" },
    ],
    conditions: [
      c(
        "amueblado",
        "si",
        "Amueblada",
        "Inventario de 64 piezas con foto. Ropa de cama y cocina equipada.",
      ),
      c(
        "mascotas",
        "si",
        "Sí, hasta 2",
        "Perros o gatos de cualquier tamaño. Depósito de mascota: $150, se devuelve.",
      ),
      c("invitados", "si", "Sí", "Pueden quedarse a dormir hasta 3 noches seguidas sin avisar."),
      c("fumar", "parcial", "Solo en la terraza", "Dentro de la casa, no."),
      c(
        "negocio",
        "parcial",
        "Oficina en casa",
        "Trabajar desde casa, sí. Atender clientes o poner rótulo, no.",
      ),
      c("eventos", "parcial", "Reuniones pequeñas", "Hasta 15 personas y hasta las 22:00."),
      c("ninos", "si", "Sí", "Jardín cerrado. No hay piscina."),
      c("silencio", "parcial", "22:00 – 7:00", "Lo pide la colonia, no el propietario."),
      c("estacionamiento", "si", "2 vehículos", "Cochera techada con portón eléctrico."),
      c(
        "accesibilidad",
        "parcial",
        "Una sola planta",
        "Sin escalones dentro. La entrada tiene un escalón de 12 cm.",
      ),
      c("subarriendo", "no", "No", "Ni por días ni por habitaciones."),
    ],
    rules: [
      "Separar la basura en orgánico, reciclable y resto. El camión pasa martes y viernes.",
      "Si alguien se queda más de tres noches, se avisa por el chat.",
      "Lo que se rompa se reporta en 48 horas. Las reparaciones por uso normal las paga el propietario.",
      "El riego es automático; solo hay que revisar que funcione en época seca.",
      "No cambiar cerraduras sin avisar.",
    ],
    floors: [
      floor("pb", "Planta única", 19.5, 13.5, [
        r("dormitorio", "Dormitorio principal", 0, 0, 4.5, 4, ["dormCortinas", "camaRayas"], {
          features: ["Cama king", "Clóset empotrado", "Aire acondicionado", "Cortinas blackout"],
          view: { label: "Al jardín" },
        }),
        r("bano", "Baño principal", 4.5, 0, 2.5, 2.5, ["banoTerracota", "banoTravertino"], {
          features: ["Ducha a ras de piso", "Agua caliente", "Ventana"],
        }),
        r("pasillo", "Vestíbulo", 4.5, 2.5, 2.5, 5, ["puertaMadera", "entradaPiedra"], {
          features: ["Clóset de visitas", "Cerradura con código"],
          note: "Puerta principal de cedro. Se entra directo, sin pasillo largo.",
        }),
        r("dormitorio", "Dormitorio 2", 0, 4, 4.5, 3.5, ["dormEscritorio", "dormCojines"], {
          features: ["Cama queen", "Clóset", "Ventilador de techo", "Escritorio"],
        }),
        r("bano", "Baño 2", 0, 7.5, 2.5, 3, ["banoPiedra"], {
          features: ["Ducha", "Agua caliente"],
        }),
        r("estudio", "Estudio", 2.5, 7.5, 4.5, 3, ["oficinaLibros", "oficinaVentana"], {
          features: ["Escritorio de roble", "Internet por cable", "Silla ergonómica"],
          note: "Puede ser tercer dormitorio: cabe una cama queen.",
        }),
        r("sala", "Sala", 7, 0, 5.5, 5, ["salaChimenea", "salaBeige"], {
          features: ["Doble altura", "Ventilador de techo", 'Smart TV de 65"'],
          view: { label: "Al jardín" },
        }),
        r("comedor", "Comedor", 7, 5, 5.5, 2.5, ["comedorLamparas", "comedorSol"], {
          features: ["Mesa para 8", "Luz natural"],
        }),
        r("cocina", "Cocina", 12.5, 0, 3.5, 4.5, ["cocinaVentanas", "cocinaCurva"], {
          features: [
            "Estufa de gas",
            "Horno",
            "Refrigeradora",
            "Lavavajillas",
            "Cafetera espresso",
          ],
        }),
        r("lavanderia", "Lavandería", 12.5, 4.5, 3.5, 3, ["cocinaMadera"], {
          features: ["Lavadora", "Secadora", "Despensa"],
        }),
        r("cochera", "Cochera", 16, 0, 3.5, 6, ["casaTropicalAutos"], {
          features: ["Techada", "2 vehículos", "Portón eléctrico"],
        }),
        r("terraza", "Terraza", 7, 7.5, 9, 3, ["patioMimbre", "patioPlantas"], {
          features: ["Techada", "Comedor exterior", "Hamacas"],
          view: { label: "Al volcán de San Salvador", photo: "volcanAtardecer" },
        }),
        r("jardin", "Jardín", 0, 10.5, 16, 3, ["jardinBananos", "jardinTropical"], {
          features: ["Cerrado", "Tres naranjos", "Riego automático"],
          note: "De ahí el nombre de la casa.",
        }),
      ]),
    ],
    ownerId: "andres",
    verified: { identity: true, deed: true, visit: "2 nov 2026" },
    rating: { score: 4.9, count: 23, fidelity: 5 },
    reviews: [
      {
        author: "Gabriela M.",
        date: "oct 2026",
        duration: "anio",
        score: 5,
        fidelity: 5,
        text: "Todo lo que decía la ficha era exacto, hasta el escalón de 12 cm de la entrada. Andrés contesta rápido y no complica nada.",
      },
      {
        author: "Tomás R.",
        date: "jun 2026",
        duration: "semana",
        score: 5,
        fidelity: 5,
        text: "Vinimos una semana por trabajo con nuestro perro. El jardín cerrado fue clave. La terraza al atardecer, mejor que en las fotos.",
      },
      {
        author: "Valeria y Diego",
        date: "feb 2026",
        duration: "seis",
        score: 4.8,
        fidelity: 5,
        text: "Seis meses sin una sorpresa en el recibo: el total era el total. Solo echamos de menos un segundo baño completo cerca de la sala.",
      },
    ],
    instantApproval: true,
    availableFrom: "2026-12-01",
    publishedAt: "2026-11-04",
    nearby: [
      { label: "Supermercado", value: "6 min a pie" },
      { label: "Parada de bus", value: "3 min a pie" },
      { label: "Paseo El Carmen", value: "9 min en auto" },
      { label: "Colegio", value: "4 min en auto" },
      { label: "Hospital", value: "12 min en auto" },
    ],
    booked: [["2026-11-01", "2026-11-30"]],
  },
  {
    id: "apartamento-las-palmas",
    title: "Apartamento Las Palmas",
    type: "Apartamento",
    zone: "Santa Tecla",
    region: "La Libertad",
    lat: 13.6721,
    lng: -89.2905,
    bedrooms: 2,
    bathrooms: 1,
    area: 58,
    cover: "edificioBalcones",
    summary: "Cuarto piso con ascensor, balcón al volcán y todo incluido en el total.",
    description:
      "Apartamento de dos habitaciones en un edificio de seis pisos con ascensor y parqueo en sótano. El balcón da al volcán de San Salvador. Agua, luz e internet ya están en el precio: lo que ves es lo que pagas.",
    prices: { mes: 395, seis: 380, anio: 365 },
    deposit: 395,
    includes: [
      { label: "Agua", included: true },
      { label: "Luz", included: true, note: "Hasta 150 kWh al mes" },
      { label: "Internet de 100 Mb", included: true },
      { label: "Cuota de mantenimiento", included: true },
      { label: "Gas", included: false, note: "Estufa eléctrica, no se usa gas" },
    ],
    conditions: [
      c(
        "amueblado",
        "parcial",
        "Semiamueblado",
        "Cocina equipada, camas y sofá. No hay televisor.",
      ),
      c("mascotas", "parcial", "Gatos sí, perros no", "Lo dice el reglamento del edificio."),
      c("invitados", "si", "Sí", "Pernocta de hasta 2 noches seguidas."),
      c("fumar", "no", "No", "Tampoco en el balcón."),
      c("negocio", "no", "Solo vivienda", "Uso residencial únicamente."),
      c("eventos", "no", "No"),
      c("ninos", "si", "Sí", "Balcón con barandal de 1,10 m."),
      c("silencio", "parcial", "21:00 – 7:00", "Reglamento del edificio."),
      c("estacionamiento", "si", "1 vehículo", "Parqueo asignado en el sótano."),
      c("accesibilidad", "si", "Ascensor", "Ascensor hasta el cuarto piso."),
      c("subarriendo", "no", "No"),
    ],
    rules: [
      "El ascensor no se usa para mudanzas sin avisar a administración.",
      "La basura baja al cuarto del sótano antes de las 20:00.",
      "No tender ropa en el balcón: hay tendedero en la azotea.",
    ],
    floors: [
      floor("p4", "Piso 4", 10, 6, [
        r("sala", "Sala y comedor", 0, 0, 4.5, 4, ["salaNaranja", "comedorRedondo"], {
          features: ["Sofá de 3 plazas", "Mesa para 4", "Ventilador de techo"],
          view: { label: "A la ciudad" },
        }),
        r("cocina", "Cocina", 4.5, 0, 2.5, 2.5, ["cocinaRedonda"], {
          features: ["Estufa eléctrica", "Refrigeradora", "Microondas"],
        }),
        r("bano", "Baño", 4.5, 2.5, 2.5, 1.8, ["banoArco"], {
          features: ["Ducha", "Agua caliente"],
        }),
        r("pasillo", "Pasillo", 4.5, 4.3, 2.5, 1.7, ["puertaLuz"], {
          features: ["Clóset de blancos"],
        }),
        r("dormitorio", "Dormitorio 1", 7, 0, 3, 3.4, ["dormCojines", "camaHecha"], {
          features: ["Cama queen", "Clóset", "Aire acondicionado"],
        }),
        r("dormitorio", "Dormitorio 2", 7, 3.4, 3, 2.6, ["dormMinimal"], {
          features: ["Cama individual", "Escritorio", "Ventilador de techo"],
        }),
        r("balcon", "Balcón", 0, 4, 4.5, 1.6, ["balconNoche"], {
          features: ["Plantas", "Mesa para 2"],
          view: { label: "Al volcán de San Salvador", photo: "volcanNoche" },
        }),
      ]),
    ],
    ownerId: "claudia",
    verified: { identity: true, deed: true, visit: "28 oct 2026" },
    rating: { score: 4.8, count: 41, fidelity: 4.9 },
    reviews: [
      {
        author: "Kevin A.",
        date: "sep 2026",
        duration: "anio",
        score: 4.8,
        fidelity: 5,
        text: "Un año sin un solo cobro extra. Claudia vive arriba y resolvió una fuga en una hora.",
      },
      {
        author: "Mónica L.",
        date: "may 2026",
        duration: "seis",
        score: 4.7,
        fidelity: 4.8,
        text: "El segundo cuarto es pequeño, pero la ficha lo decía con medidas exactas. Nada que reclamar.",
      },
    ],
    instantApproval: true,
    availableFrom: "2026-11-20",
    publishedAt: "2026-11-08",
    nearby: [
      { label: "Supermercado", value: "4 min a pie" },
      { label: "Parque San Martín", value: "8 min a pie" },
      { label: "Universidad", value: "7 min en auto" },
      { label: "Hospital", value: "10 min en auto" },
    ],
  },
  {
    id: "casa-mirador-el-tunco",
    title: "Casa Mirador El Tunco",
    type: "Casa",
    zone: "El Tunco",
    region: "La Libertad",
    lat: 13.4935,
    lng: -89.3835,
    bedrooms: 4,
    bathrooms: 3,
    area: 165,
    lot: 308,
    cover: "piscinaPalmeras",
    summary: "Frente a la piedra de El Tunco, piscina, terraza al mar y lugar para diez.",
    description:
      "Casa de playa a doscientos metros de la piedra de El Tunco. La terraza mira al mar y al atardecer; la piscina está entre palmeras. Doña Rosa, la vecina, abre la casa y explica todo. Se alquila por días, semanas o un mes.",
    prices: { dia: 210, semana: 1190, mes: 2900 },
    deposit: 1500,
    depositShort: 200,
    includes: [
      { label: "Agua y luz", included: true },
      { label: "Internet satelital", included: true },
      { label: "Limpieza de salida", included: true },
      { label: "Toallas de playa", included: true },
      { label: "Cuidadora de la casa", included: true, note: "Doña Rosa, de 7:00 a 16:00" },
      { label: "Cocinera", included: false, note: "Opcional: $35 al día" },
    ],
    conditions: [
      c("amueblado", "si", "Amueblada", "Para diez personas: hamacas, parrilla y cocina completa."),
      c("mascotas", "parcial", "1 perro pequeño", "Avisar antes de llegar. No en la piscina."),
      c("invitados", "si", "Hasta 10 a dormir", "Visitas de día: hasta 15 personas."),
      c("fumar", "parcial", "Solo exteriores"),
      c("negocio", "no", "Solo vivienda", "Sesiones de fotos comerciales, solo con permiso."),
      c(
        "eventos",
        "parcial",
        "Celebraciones pequeñas",
        "Hasta 20 personas con aviso. Música hasta las 22:00.",
      ),
      c("ninos", "parcial", "Con supervisión", "La piscina no tiene cerco."),
      c("silencio", "parcial", "22:00 – 8:00"),
      c("estacionamiento", "si", "3 vehículos", "Dentro del portón."),
      c("accesibilidad", "no", "Con escaleras", "Escaleras de piedra hacia la playa."),
      c("subarriendo", "no", "No"),
    ],
    rules: [
      "Se entra a la piscina sin arena: hay ducha exterior junto a la puerta.",
      "Las tablas de surf se guardan en el rack de la cochera.",
      "La música se baja a las 22:00. Los vecinos son pescadores y madrugan.",
      "Hora de salida: 11:00. Si necesitas más tiempo, pregunta: casi siempre se puede.",
    ],
    floors: [
      floor("pp", "Planta principal", 22, 14, [
        r("sala", "Sala", 0, 0, 7, 5, ["salaBlanca", "salaRamas"], {
          features: ["Ventanales corredizos", "Ventilador de techo", "Bocinas"],
          view: { label: "Al mar" },
        }),
        r("cocina", "Cocina", 7, 0, 4, 5, ["cocinaConcreto", "cocinaBlanca"], {
          features: ["Isla", "Estufa de gas", "Refrigeradora doble", "Hielera"],
        }),
        r("dormitorio", "Dormitorio principal", 11, 0, 5.5, 5, ["dormLampara", "camaSabana"], {
          features: ["Cama king", "Aire acondicionado", "Baño privado"],
          view: { label: "Al mar", photo: "tuncoOla" },
        }),
        r("bano", "Baño principal", 16.5, 0, 2.5, 2.5, ["banoTravertino", "duchaTravertino"], {
          features: ["Ducha", "Agua caliente", "Doble lavamanos"],
        }),
        r("bano", "Baño 2", 16.5, 2.5, 2.5, 2.5, ["banoPiedra"], {
          features: ["Ducha", "Agua caliente"],
        }),
        r("dormitorio", "Dormitorio 2", 19, 0, 3, 5, ["camaLino"], {
          features: ["Cama queen", "Aire acondicionado"],
        }),
        r("dormitorio", "Dormitorio 3", 0, 5, 4, 4, ["camaHecha"], {
          features: ["Dos camas individuales", "Ventilador de techo"],
        }),
        r("dormitorio", "Dormitorio 4", 4, 5, 3.5, 4, ["estudioLoft"], {
          features: ["Literas para 4", "Ventilador de techo"],
          note: "Pensado para niños o grupos de surf.",
        }),
        r("bano", "Baño 3", 7.5, 5, 2.5, 4, ["banoRustico"], {
          features: ["Ducha exterior", "Agua caliente"],
        }),
        r("terraza", "Terraza", 10, 5, 12, 4, ["terrazaSofas", "terrazaMesa", "terrazaColgantes"], {
          features: ["Techada", "Comedor para 12", "Hamacas", "Parrilla"],
          view: { label: "Al mar y a la piedra de El Tunco", photo: "tuncoAtardecer" },
        }),
        r("piscina", "Piscina", 12, 9.5, 8, 3.5, ["piscinaPalmeras", "piscinaInfinita"], {
          features: ["Iluminada", "Profundidad de 1,20 a 1,60 m"],
          view: { label: "Al mar" },
        }),
        r("jardin", "Jardín", 0, 9, 10, 5, ["jardinTropical"], {
          features: ["Palmeras", "Ducha exterior", "Rack para tablas"],
        }),
      ]),
    ],
    ownerId: "rafael",
    verified: { identity: true, deed: true, visit: "20 oct 2026" },
    rating: { score: 4.9, count: 57, fidelity: 4.8 },
    reviews: [
      {
        author: "Andrea P.",
        date: "oct 2026",
        duration: "dia",
        score: 5,
        fidelity: 5,
        text: "Vinimos por el día para un cumpleaños. Ya sabíamos que la música era hasta las 22:00, así que nadie se llevó una sorpresa.",
      },
      {
        author: "Chris & Ana",
        date: "ago 2026",
        duration: "mes",
        score: 4.8,
        fidelity: 4.6,
        text: "Un mes trabajando desde la terraza. El internet satelital es estable, aunque no es fibra: la ficha lo aclaraba.",
      },
    ],
    promoted: true,
    instantApproval: true,
    availableFrom: "2026-11-14",
    publishedAt: "2026-10-21",
    nearby: [
      { label: "Playa", value: "2 min a pie" },
      { label: "Restaurantes", value: "4 min a pie" },
      { label: "Supermercado", value: "15 min en auto" },
      { label: "Aeropuerto", value: "40 min en auto" },
    ],
    booked: [
      ["2026-11-20", "2026-11-23"],
      ["2026-12-18", "2026-12-28"],
    ],
  },
  {
    id: "cabana-coatepeque",
    title: "Cabaña del Lago",
    type: "Cabaña",
    zone: "Lago de Coatepeque",
    region: "Santa Ana",
    lat: 13.8655,
    lng: -89.5455,
    bedrooms: 2,
    bathrooms: 1,
    area: 72,
    cover: "casaLago",
    summary: "Muelle propio sobre el lago, dos kayaks y la niebla de la mañana.",
    description:
      "Cabaña al borde del lago de Coatepeque con muelle propio. Se baja por cuarenta escalones de piedra; la ficha lo dice porque importa. En las mañanas hay niebla sobre el agua y por la tarde se nada desde el muelle.",
    prices: { dia: 120, semana: 690, mes: 1600 },
    deposit: 800,
    depositShort: 100,
    includes: [
      { label: "Agua y luz", included: true },
      { label: "Internet de 50 Mb", included: true },
      { label: "Dos kayaks y chalecos", included: true },
      { label: "Leña", included: false, note: "$8 la carga" },
    ],
    conditions: [
      c("amueblado", "si", "Amueblada"),
      c("mascotas", "si", "Sí", "Perros bienvenidos. Ojo con el muelle."),
      c("invitados", "parcial", "Hasta 6 personas"),
      c("fumar", "parcial", "Solo en el muelle"),
      c("negocio", "no", "Solo vivienda"),
      c("eventos", "no", "No", "Es una zona tranquila y el sonido viaja sobre el agua."),
      c("ninos", "parcial", "Con supervisión", "El muelle no tiene barandal."),
      c("silencio", "parcial", "21:00 – 7:00"),
      c("estacionamiento", "si", "2 vehículos", "Arriba, junto a la calle."),
      c("accesibilidad", "no", "Con escaleras", "Cuarenta escalones de piedra."),
      c("subarriendo", "no", "No"),
    ],
    rules: [
      "Chaleco puesto en el kayak, siempre.",
      "No se usa jabón en el lago: hay ducha junto al muelle.",
      "La leña se pide con un día de anticipación.",
    ],
    floors: [
      floor("pu", "Planta única", 12, 13, [
        r("sala", "Sala", 0, 0, 5, 4, ["concretoLago", "salaLino"], {
          features: ["Ventanal al lago", "Chimenea"],
          view: { label: "Al lago", photo: "lagoVolcanes" },
        }),
        r("cocina", "Cocina", 5, 0, 3, 4, ["cocinaCurva"], {
          features: ["Estufa de gas", "Refrigeradora", "Cafetera"],
        }),
        r("dormitorio", "Dormitorio 1", 8, 0, 4, 3.5, ["camaSabana"], {
          features: ["Cama queen", "Ventilador de techo"],
          view: { label: "Al lago" },
        }),
        r("dormitorio", "Dormitorio 2", 8, 3.5, 4, 3, ["estudioCama"], {
          features: ["Dos camas individuales"],
        }),
        r("bano", "Baño", 5, 4, 3, 2.5, ["banoRustico"], { features: ["Ducha", "Agua caliente"] }),
        r("terraza", "Deck", 0, 4, 5, 4, ["deckLago", "lagoVolcanes"], {
          features: ["Hamacas", "Comedor exterior"],
          view: { label: "Al lago y a los volcanes", photo: "lagoVolcanes" },
        }),
        r("muelle", "Muelle", 1, 8, 3, 5, ["coatepequeMuelle", "coatepequeNiebla"], {
          features: ["Escalera al agua", "Dos kayaks", "Hamaca"],
          view: { label: "Al lago", photo: "coatepequeNiebla" },
        }),
      ]),
    ],
    ownerId: "lucia",
    verified: { identity: true, deed: true },
    rating: { score: 4.7, count: 34, fidelity: 4.9 },
    reviews: [
      {
        author: "Fernando G.",
        date: "sep 2026",
        duration: "semana",
        score: 4.7,
        fidelity: 5,
        text: "Los cuarenta escalones son reales, y qué bueno que lo avisaran: venía mi papá y planeamos con tiempo.",
      },
    ],
    availableFrom: "2026-11-12",
    publishedAt: "2026-09-30",
    nearby: [
      { label: "Restaurante en el lago", value: "5 min en lancha" },
      { label: "Tienda", value: "6 min en auto" },
      { label: "Santa Ana", value: "35 min en auto" },
    ],
  },
  {
    id: "loft-san-benito",
    title: "Loft San Benito",
    type: "Loft",
    zone: "San Benito",
    region: "San Salvador",
    lat: 13.6985,
    lng: -89.2412,
    bedrooms: 1,
    bathrooms: 1.5,
    area: 86,
    cover: "edificioMadera",
    summary: "Doble altura de 5,4 m, uso mixto: se puede atender clientes con cita.",
    description:
      "Loft de doble altura con dormitorio en mezzanine. Es uno de los pocos alquileres de la zona con uso mixto permitido: puedes registrar tu empresa con esta dirección y recibir clientes con cita.",
    prices: { semana: 380, mes: 890, seis: 840, anio: 790 },
    deposit: 890,
    depositShort: 120,
    includes: [
      { label: "Agua", included: true },
      { label: "Fibra de 500 Mb", included: true },
      { label: "Cuota del edificio", included: true },
      { label: "Luz", included: false, note: "Medidor propio: promedio de $45 al mes" },
    ],
    conditions: [
      c("amueblado", "si", "Amueblado"),
      c("mascotas", "no", "No", "Reglamento del edificio."),
      c("invitados", "si", "Sí"),
      c("fumar", "no", "No"),
      c(
        "negocio",
        "si",
        "Uso mixto",
        "Atención a clientes con cita. Placa pequeña permitida en el buzón.",
      ),
      c("eventos", "no", "No"),
      c("ninos", "parcial", "No ideal", "La escalera al mezzanine es abierta."),
      c("silencio", "parcial", "22:00 – 7:00"),
      c("estacionamiento", "si", "1 vehículo + visitas"),
      c("accesibilidad", "parcial", "Ascensor", "El mezzanine es por escalera."),
      c("subarriendo", "no", "No"),
    ],
    rules: [
      "Los clientes se anuncian en recepción.",
      "Mudanzas solo de lunes a viernes, de 8:00 a 17:00.",
    ],
    floors: [
      floor("pb", "Planta baja", 10, 7, [
        r("sala", "Sala de doble altura", 0, 0, 6, 4.5, ["loftCircular", "concretoBanca"], {
          features: ["Doble altura de 5,4 m", "Ventanal", "Aire acondicionado"],
          view: { label: "A la ciudad" },
        }),
        r("cocina", "Cocina", 6, 0, 4, 3, ["cocinaIsla"], {
          features: ["Isla", "Estufa de inducción", "Horno"],
        }),
        r("estudio", "Estudio", 6, 3, 4, 2.5, ["oficinaTejados"], {
          features: ["Escritorio para 2", "Fibra de 500 Mb", "Pizarra"],
          note: "Con puerta corrediza: sirve para recibir clientes.",
        }),
        r("bano", "Medio baño", 6, 5.5, 2, 1.5, ["banoRosa"], {
          features: ["Lavamanos", "Inodoro"],
        }),
        r("balcon", "Balcón", 0, 4.5, 6, 2.5, ["azoteaBahia"], {
          features: ["Plantas", "Mesa para 2"],
          view: { label: "A la ciudad", photo: "volcanAtardecer" },
        }),
      ]),
      floor("mz", "Mezzanine", 10, 7, [
        r("dormitorio", "Dormitorio", 0, 0, 6, 4, ["dormMinimal"], {
          features: ["Cama queen", "Clóset", "Aire acondicionado"],
          note: "Abierto hacia la sala, con cortina de lino.",
        }),
        r("bano", "Baño", 6, 0, 4, 3, ["duchaTravertino"], {
          features: ["Ducha", "Agua caliente"],
        }),
      ]),
    ],
    ownerId: "mauricio",
    verified: { identity: true, deed: true, visit: "5 nov 2026" },
    rating: { score: 4.8, count: 19, fidelity: 5 },
    reviews: [
      {
        author: "Lorena V.",
        date: "ago 2026",
        duration: "anio",
        score: 4.8,
        fidelity: 5,
        text: "Registré mi estudio de arquitectura aquí. La carta de autorización venía con el contrato, sin pedirla.",
      },
    ],
    availableFrom: "2026-11-15",
    publishedAt: "2026-11-06",
    nearby: [
      { label: "Zona Rosa", value: "5 min a pie" },
      { label: "Cafés", value: "2 min a pie" },
      { label: "Centro financiero", value: "6 min en auto" },
    ],
  },
  {
    id: "casa-colonial-suchitoto",
    title: "Casa del Patio",
    type: "Casa",
    zone: "Suchitoto",
    region: "Cuscatlán",
    lat: 13.9378,
    lng: -89.0275,
    bedrooms: 3,
    bathrooms: 2,
    area: 230,
    lot: 288,
    cover: "fachadaColonial",
    summary: "Casa colonial con patio central y un taller con puerta a la calle.",
    description:
      "Casa colonial restaurada a tres cuadras de la iglesia de Santa Lucía. Las habitaciones dan al patio central; el taller tiene puerta propia a la calle y se puede usar como galería o tienda.",
    prices: { semana: 560, mes: 1100, seis: 990 },
    deposit: 1100,
    depositShort: 150,
    includes: [
      { label: "Agua y luz", included: true },
      { label: "Internet de 100 Mb", included: true },
      { label: "Jardinería del patio", included: true },
      { label: "Permiso municipal del taller", included: false, note: "Por cuenta del inquilino" },
    ],
    conditions: [
      c("amueblado", "si", "Amueblada", "Muebles de cedro hechos en Suchitoto."),
      c("mascotas", "si", "Sí"),
      c("invitados", "si", "Sí"),
      c("fumar", "parcial", "En el patio"),
      c("negocio", "si", "Con atención al público", "El taller tiene puerta a la calle."),
      c("eventos", "parcial", "Hasta 30 personas", "En el patio y hasta las 23:00."),
      c("ninos", "si", "Sí"),
      c("silencio", "parcial", "23:00 – 7:00"),
      c("estacionamiento", "parcial", "En la calle", "Calle empedrada, frente a la casa."),
      c("accesibilidad", "parcial", "Una planta", "Umbral de piedra de 8 cm."),
      c("subarriendo", "no", "No"),
    ],
    rules: [
      "Las paredes son de adobe: nada de clavos, hay rieles para colgar cuadros.",
      "La fuente del patio se apaga de noche.",
    ],
    floors: [
      floor("pu", "Planta única", 18, 16, [
        r("sala", "Sala", 0, 0, 6, 5, ["salaLino"], {
          features: ["Techo de teja", "Ventilador de techo"],
        }),
        r("comedor", "Comedor", 6, 0, 6, 5, ["comedorClaro", "comedorDorado"], {
          features: ["Mesa para 10"],
        }),
        r("cocina", "Cocina", 12, 0, 6, 5, ["cocinaMadera"], {
          features: ["Estufa de gas", "Horno de leña"],
        }),
        r("dormitorio", "Dormitorio 1", 0, 5, 5, 5, ["dormCortinas"], {
          features: ["Cama king", "Ventilador de techo"],
        }),
        r("patio", "Patio central", 5, 5, 8, 6, ["claustroPalmas", "claustroRojo"], {
          features: ["Fuente de piedra", "Corredor techado", "Naranjo"],
          view: { label: "A la iglesia de Santa Lucía", photo: "santaLucia" },
        }),
        r("dormitorio", "Dormitorio 2", 13, 5, 5, 5, ["camaLino"], { features: ["Cama queen"] }),
        r("bano", "Baño 1", 0, 10, 2.5, 3, ["banoRustico"], {
          features: ["Ducha", "Agua caliente"],
        }),
        r("estudio", "Taller", 2.5, 11, 5, 5, ["oficinaLibros"], {
          features: ["Puerta a la calle", "Vitrina"],
          note: "Sirve de galería, tienda o taller.",
          view: { label: "A la calle", photo: "suchitotoCalle" },
        }),
        r("pasillo", "Corredor", 7.5, 11, 3, 5, ["claustroEscalera"]),
        r("dormitorio", "Dormitorio 3", 10.5, 11, 5, 5, ["dormEscritorio"], {
          features: ["Cama queen", "Escritorio"],
        }),
        r("bano", "Baño 2", 15.5, 10, 2.5, 3, ["banoTerracota"], {
          features: ["Ducha", "Agua caliente"],
        }),
      ]),
    ],
    ownerId: "anaSofia",
    verified: { identity: true, deed: true },
    rating: { score: 5, count: 12, fidelity: 5 },
    reviews: [
      {
        author: "Sofía H.",
        date: "jul 2026",
        duration: "seis",
        score: 5,
        fidelity: 5,
        text: "Abrí mi taller de cerámica en el cuarto que da a la calle. Todo estaba escrito desde el principio.",
      },
    ],
    availableFrom: "2026-12-05",
    publishedAt: "2026-10-12",
    nearby: [
      { label: "Iglesia de Santa Lucía", value: "4 min a pie" },
      { label: "Mercado", value: "6 min a pie" },
      { label: "Lago Suchitlán", value: "8 min en auto" },
    ],
  },
  {
    id: "cabana-ataco",
    title: "Cabaña El Cafetal",
    type: "Cabaña",
    zone: "Concepción de Ataco",
    region: "Ahuachapán",
    lat: 13.8705,
    lng: -89.8495,
    bedrooms: 2,
    bathrooms: 1,
    area: 78,
    cover: "cabanaA",
    summary: "Cabaña de madera dentro de una finca de café, con chimenea y leña incluida.",
    description:
      "Cabaña de madera en la Ruta de las Flores, dentro de una finca de café. Hace frío de noche, por eso la leña va incluida. Fumar no se permite: todo es madera.",
    prices: { dia: 85, semana: 480, mes: 1050 },
    deposit: 600,
    depositShort: 80,
    includes: [
      { label: "Agua y luz", included: true },
      { label: "Leña", included: true },
      { label: "Café de la finca", included: true, note: "Una libra por semana" },
      { label: "Internet de 30 Mb", included: true },
    ],
    conditions: [
      c("amueblado", "si", "Amueblada"),
      c("mascotas", "si", "Sí", "En la finca hay perros sueltos y amables."),
      c("invitados", "parcial", "Hasta 5 personas"),
      c("fumar", "no", "No", "Riesgo de incendio: todo es madera."),
      c("negocio", "no", "Solo vivienda"),
      c("eventos", "no", "No"),
      c("ninos", "si", "Sí"),
      c("silencio", "parcial", "22:00 – 7:00"),
      c("estacionamiento", "si", "1 vehículo"),
      c("accesibilidad", "no", "Con escaleras", "Camino de tierra y escalones."),
      c("subarriendo", "no", "No"),
    ],
    rules: ["La chimenea se apaga antes de dormir.", "Recorrido por la finca: sábados a las 9:00."],
    floors: [
      floor("pu", "Planta única", 11, 10, [
        r("sala", "Sala con chimenea", 0, 0, 6, 4.5, ["cabanaColgante", "cabanaPiedra"], {
          features: ["Chimenea", "Tocadiscos"],
          view: { label: "A la montaña" },
        }),
        r("cocina", "Cocina", 6, 0, 5, 3, ["cabanaEstufa"], {
          features: ["Estufa de gas", "Cafetera de goteo"],
        }),
        r("bano", "Baño", 7.5, 3, 3.5, 2.5, ["banoPiedra"], {
          features: ["Ducha", "Agua caliente"],
        }),
        r("dormitorio", "Dormitorio 1", 0, 4.5, 4, 3.5, ["camaRayas"], {
          features: ["Cama queen", "Cobijas de lana"],
        }),
        r("dormitorio", "Dormitorio 2", 4, 4.5, 3.5, 3.5, ["dormCojines"], {
          features: ["Cama individual"],
        }),
        r("lavanderia", "Lavandería", 7.5, 5.5, 3.5, 2.5, ["cocinaMadera"], {
          features: ["Pila", "Tendedero"],
        }),
        r("terraza", "Terraza", 0, 8, 11, 2, ["deckLago"], {
          features: ["Hamacas"],
          view: { label: "A la montaña", photo: "deckLago" },
        }),
      ]),
    ],
    ownerId: "ernesto",
    verified: { identity: true, deed: true },
    rating: { score: 4.8, count: 66, fidelity: 4.7 },
    reviews: [
      {
        author: "Paola R.",
        date: "oct 2026",
        duration: "dia",
        score: 4.9,
        fidelity: 4.8,
        text: "Una noche con chimenea y el mejor café que he tomado. El camino de tierra estaba descrito tal cual.",
      },
    ],
    availableFrom: "2026-11-11",
    publishedAt: "2026-08-02",
    nearby: [
      { label: "Ataco centro", value: "8 min en auto" },
      { label: "Juayúa", value: "25 min en auto" },
    ],
  },
  {
    id: "penthouse-antiguo-cuscatlan",
    title: "Penthouse La Cima",
    type: "Penthouse",
    zone: "Antiguo Cuscatlán",
    region: "La Libertad",
    lat: 13.6735,
    lng: -89.252,
    bedrooms: 3,
    bathrooms: 3.5,
    area: 236,
    cover: "torreVerde",
    summary: "Piso 18 con piscina en la terraza y el volcán de San Salvador de frente.",
    description:
      "Penthouse en el piso 18 con ascensor privado. La terraza tiene piscina de nueve metros y mira al volcán de San Salvador. Semiamueblado: cocina, línea blanca y lámparas; las camas las traes tú.",
    prices: { mes: 2400, seis: 2250, anio: 2100 },
    deposit: 4200,
    includes: [
      { label: "Agua", included: true },
      { label: "Cuota de mantenimiento", included: true },
      { label: "Fibra de 1 Gb", included: true },
      { label: "Luz", included: false, note: "Promedio de $120 al mes" },
    ],
    conditions: [
      c(
        "amueblado",
        "parcial",
        "Semiamueblado",
        "Cocina, línea blanca, cortinas y lámparas. Sin camas.",
      ),
      c("mascotas", "parcial", "Hasta 10 kg"),
      c("invitados", "si", "Sí"),
      c("fumar", "parcial", "En la terraza"),
      c("negocio", "parcial", "Oficina en casa"),
      c("eventos", "parcial", "Hasta 25 personas", "Avisar a la administración del edificio."),
      c("ninos", "si", "Sí", "Piscina con cerco de vidrio."),
      c("silencio", "parcial", "22:00 – 7:00"),
      c("estacionamiento", "si", "3 vehículos"),
      c("accesibilidad", "si", "Ascensor privado"),
      c("subarriendo", "no", "No"),
    ],
    rules: ["Las reuniones en la terraza se avisan con 48 horas a administración."],
    floors: [
      floor("p18", "Piso 18", 20, 14, [
        r("sala", "Sala", 0, 0, 8, 6, ["salaLuz", "salaVentanal"], {
          features: ["Ventanal de piso a techo", "Aire acondicionado"],
          view: { label: "Al volcán de San Salvador", photo: "volcanNoche" },
        }),
        r("comedor", "Comedor", 8, 0, 5, 4, ["comedorModerno"], { features: ["Mesa para 8"] }),
        r("cocina", "Cocina", 13, 0, 4, 4, ["cocinaIsla"], {
          features: ["Isla", "Vinera", "Lavavajillas"],
        }),
        r("lavanderia", "Lavandería", 17, 0, 3, 4, ["cocinaMadera"], {
          features: ["Lavadora", "Secadora"],
        }),
        r("estudio", "Estudio", 8, 4, 4, 3, ["oficinaVentana"], {
          features: ["Escritorio", "Fibra de 1 Gb"],
        }),
        r("dormitorio", "Dormitorio principal", 12, 4, 8, 5, ["dormMinimal"], {
          features: ["Vestidor", "Baño privado", "Aire acondicionado"],
          view: { label: "A la ciudad", photo: "volcanAtardecer" },
        }),
        r("dormitorio", "Dormitorio 2", 0, 6, 4, 4, ["dormCortinas"], { features: ["Clóset"] }),
        r("dormitorio", "Dormitorio 3", 4, 6, 4, 4, ["dormEscritorio"], {
          features: ["Clóset", "Escritorio"],
        }),
        r("bano", "Medio baño", 8, 7, 2, 2, ["banoTerracota"]),
        r("pasillo", "Pasillo", 10, 7, 2, 3, ["puertaLuz"]),
        r("bano", "Baño principal", 16, 9, 4, 3, ["banoRosa"], {
          features: ["Tina", "Doble lavamanos"],
        }),
        r("bano", "Baño 2", 0, 10, 3, 2.5, ["banoArco"], { features: ["Ducha"] }),
        r("terraza", "Terraza", 3, 10, 13, 4, ["piscinaBahia", "azoteaBahia"], {
          features: ["Piscina de 9 m", "Jacuzzi", "Parrilla", "Pérgola"],
          view: { label: "Al volcán y al valle", photo: "volcanNoche" },
        }),
      ]),
    ],
    ownerId: "cumbre",
    verified: { identity: true, deed: true, visit: "30 oct 2026" },
    rating: { score: 4.6, count: 9, fidelity: 4.8 },
    reviews: [
      {
        author: "Ricardo S.",
        date: "sep 2026",
        duration: "anio",
        score: 4.6,
        fidelity: 4.8,
        text: "La vista de noche al volcán no tiene precio. La luz va aparte, como decía la ficha.",
      },
    ],
    promoted: true,
    availableFrom: "2026-12-01",
    publishedAt: "2026-11-02",
    nearby: [
      { label: "Centro comercial", value: "5 min en auto" },
      { label: "Colegios bilingües", value: "8 min en auto" },
      { label: "Hospital", value: "9 min en auto" },
    ],
  },
  {
    id: "estudio-centro-historico",
    title: "Estudio Plaza Libertad",
    type: "Estudio",
    zone: "Centro Histórico",
    region: "San Salvador",
    lat: 13.6985,
    lng: -89.1915,
    bedrooms: 0,
    bathrooms: 1,
    area: 38,
    cover: "fachadaTerracota",
    summary: "Edificio de 1924 restaurado, piso de ladrillo original y balcón a la plaza.",
    description:
      "Estudio en un edificio de 1924 restaurado frente a la Plaza Libertad. Piso de ladrillo original, techo de cuatro metros y balcón de hierro. Tercer piso sin ascensor.",
    prices: { semana: 150, mes: 260, seis: 245, anio: 230 },
    deposit: 260,
    depositShort: 60,
    includes: [
      { label: "Agua", included: true },
      { label: "Internet de 100 Mb", included: true },
      { label: "Luz", included: false, note: "Promedio de $18 al mes" },
    ],
    conditions: [
      c("amueblado", "si", "Amueblado"),
      c("mascotas", "parcial", "Gatos"),
      c("invitados", "parcial", "1 persona", "Es para una o dos personas."),
      c("fumar", "no", "No"),
      c("negocio", "no", "Solo vivienda"),
      c("eventos", "no", "No"),
      c("ninos", "no", "No ideal"),
      c("silencio", "parcial", "22:00 – 6:00"),
      c("estacionamiento", "no", "No", "Parqueo público a una cuadra: $40 al mes."),
      c("accesibilidad", "no", "Con escaleras", "Tercer piso sin ascensor."),
      c("subarriendo", "no", "No"),
    ],
    rules: ["El portón del edificio se cierra a las 23:00; cada inquilino tiene llave."],
    floors: [
      floor("p3", "Piso 3", 8, 6, [
        r("sala", "Sala y dormitorio", 0, 0, 5, 4.5, ["estudioCama"], {
          features: ["Cama queen", "Techo de 4 m", "Piso de ladrillo de 1924"],
          view: { label: "A la plaza" },
        }),
        r("cocina", "Cocineta", 5, 0, 3, 2.5, ["cocinaEstudio"], {
          features: ["Estufa eléctrica", "Refrigeradora pequeña"],
        }),
        r("bano", "Baño", 5, 2.5, 3, 2, ["banoTravertino"], {
          features: ["Ducha", "Agua caliente"],
        }),
        r("balcon", "Balcón", 0, 4.5, 5, 1.5, ["fachadaTerracota"], {
          features: ["Barandal de hierro"],
          view: { label: "A la Plaza Libertad", photo: "suchitotoColores" },
        }),
      ]),
    ],
    ownerId: "jorge",
    verified: { identity: true, deed: true },
    rating: { score: 4.5, count: 28, fidelity: 4.6 },
    reviews: [
      {
        author: "Iván M.",
        date: "oct 2026",
        duration: "mes",
        score: 4.5,
        fidelity: 4.6,
        text: "Las escaleras se sienten con el súper, pero el lugar es precioso y estaba avisado.",
      },
    ],
    availableFrom: "2026-11-15",
    publishedAt: "2026-10-28",
    nearby: [
      { label: "Catedral", value: "3 min a pie" },
      { label: "Teatro Nacional", value: "5 min a pie" },
      { label: "Mercado Central", value: "7 min a pie" },
    ],
  },
];

export const ZONES = [
  "Santa Tecla",
  "San Salvador",
  "San Benito",
  "Antiguo Cuscatlán",
  "Centro Histórico",
  "El Tunco",
  "Lago de Coatepeque",
  "Suchitoto",
  "Concepción de Ataco",
];

/** Zones that contain other zones when searching. */
export const ZONE_GROUPS: Record<string, string[]> = {
  "San Salvador": ["San Benito", "Centro Histórico", "Antiguo Cuscatlán", "Santa Tecla"],
};
