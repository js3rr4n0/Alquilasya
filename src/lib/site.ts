/** Datos del sitio que comparten los metadatos, el sitemap y los datos estructurados. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://alquilasya.com").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "AlquilasYa";

export const SITE_DESCRIPTION =
  "Alquiler de casas y apartamentos en El Salvador con el precio total, el depósito, el plano y las condiciones por escrito antes de contactar a nadie. Sin comisión. Publicar es gratis.";

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Preguntas frecuentes: se muestran en la portada y van como datos estructurados. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Qué es AlquilasYa?",
    a: "AlquilasYa es un portal de alquileres de El Salvador. Cada anuncio muestra el precio total, el depósito, el plano de la propiedad y once condiciones por escrito (mascotas, muebles, parqueo, invitados y más) antes de que le escribas al propietario.",
  },
  {
    q: "¿Cuánto cuesta usar AlquilasYa?",
    a: "Nada. Buscar es gratis y publicar es gratis. AlquilasYa no cobra comisión a quien busca ni a quien alquila, y no recibe ni guarda el dinero del alquiler: el pago se acuerda directamente con el propietario.",
  },
  {
    q: "¿Cómo publico mi casa o apartamento en alquiler?",
    a: "Crea una cuenta, llena el formulario guiado (datos, plano y fotos, condiciones, plazos y precios) y marca la ubicación en el mapa. Revisamos cada anuncio antes de mostrarlo al público.",
  },
  {
    q: "¿En qué zonas de El Salvador hay alquileres?",
    a: "El portal cubre los 14 departamentos y los 262 distritos del país, entre ellos San Salvador, Santa Tecla, Antiguo Cuscatlán, Santa Ana, San Miguel y La Libertad. La oferta depende de lo que publiquen los propietarios en cada zona.",
  },
  {
    q: "¿Por cuánto tiempo se puede alquilar?",
    a: "Cada propietario decide qué plazos acepta: por día, por semana, por mes, por seis meses o por un año, y pone el precio de cada uno.",
  },
  {
    q: "¿Cómo contacto al propietario?",
    a: "Desde la ficha del anuncio, con el botón «Escribir al propietario». Dejas tu nombre, tu WhatsApp y tu mensaje, y sigues la conversación por WhatsApp. Para buscar y leer anuncios no hace falta registrarse.",
  },
];
