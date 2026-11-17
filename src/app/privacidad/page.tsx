import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacidad y términos",
  description: "Qué datos guarda AlquilasYa, para qué los usa y cómo pedir que se borren.",
};

const SECTIONS = [
  {
    title: "Qué guardamos",
    body: [
      "Cuenta: nombre, correo, WhatsApp si lo das, y tu contraseña cifrada (nunca en texto legible).",
      "Lista de espera: nombre, correo, WhatsApp, departamento y si buscas o publicas.",
      "Al publicar: los datos del anuncio y tu nombre, WhatsApp y correo de contacto.",
      "Al escribirle a quien publica: los mensajes que envías y recibes en el chat.",
      "Si destacas un anuncio: el plan, el monto, la fecha y el número de transacción que nos da Wompi. Los datos de la tarjeta los maneja Wompi, nunca pasan por AlquilasYa.",
      "En tu navegador se guardan tus casas favoritas y una cookie de sesión para mantenerte dentro de tu cuenta. No usamos cookies de publicidad. Medimos visitas y velocidad con Vercel Analytics y con una analítica propia: guardamos qué páginas se abren, cuánto tiempo, qué se busca, desde qué ciudad aproximada (según la conexión), el tipo de dispositivo, sistema y navegador, y de qué sitio llegaste. Para eso tu navegador guarda un identificador aleatorio, sin tu nombre ni tu correo. No guardamos tu dirección IP: solo una huella irreversible para contar visitantes únicos. Estos datos se borran a los 13 meses, y si tu navegador envía la señal «no rastrear» (Global Privacy Control o Do Not Track) no se registra nada. Si activamos Google Analytics o Google Ads para medir campañas, esos servicios sí usan cookies.",
    ],
  },
  {
    title: "Para qué los usamos",
    body: [
      "Para avisarte del lanzamiento, revisar los anuncios (con un filtro automático y, si marca algo, una persona) y poner en contacto a quien busca con quien publica.",
      "Tu WhatsApp como anunciante no se muestra en el anuncio ni a quien te escribe: lo usamos solo para avisarte sobre tu anuncio.",
      "Los mensajes del chat solo los ven sus dos participantes. No están cifrados de extremo a extremo: se guardan en nuestra base de datos y podemos revisarlos únicamente ante una denuncia o una obligación legal.",
      "Te escribimos por correo cuando alguien te manda un mensaje, cuando tu destacado está por vencer y cuando tu anuncio necesita un cambio. Los dos primeros los puedes apagar en Mi cuenta.",
      "Si reportas un anuncio, guardamos el motivo, lo que escribas y tu cuenta (o una huella irreversible de tu conexión si no tienes cuenta), para no contar dos veces el mismo reporte. Nunca le decimos al anunciante quién lo reportó.",
      "No vendemos ni cedemos tus datos a terceros.",
    ],
  },
  {
    title: "Cómo pedir la baja o una corrección",
    body: [
      "Escribe a contacto@alquilasya.com desde el correo que registraste. Borramos o corregimos tus datos y retiramos tu anuncio si lo pides.",
    ],
  },
  {
    title: "Términos de uso",
    body: [
      "AlquilasYa publica anuncios y pone en contacto a las partes. No es parte del contrato de alquiler, no recibe ni custodia pagos y no garantiza el estado de los inmuebles.",
      "Quien publica responde por que la información de su anuncio sea cierta y por tener derecho a alquilar el inmueble. Retiramos los anuncios falsos, engañosos o ilegales. Si varias personas reportan un anuncio, lo ocultamos mientras lo revisamos.",
      "Las casas marcadas como «Ejemplo» en la portada son ilustrativas: no corresponden a inmuebles disponibles.",
      "Antes de pagar o firmar, visita el inmueble y verifica a la otra parte.",
      "Destacar un anuncio es opcional y se paga una sola vez con tarjeta en la página de Wompi (Banco Agrícola); AlquilasYa no ve ni guarda los datos de tu tarjeta. El anuncio destacado aparece primero en las búsquedas, con la etiqueta «Anuncio», durante los días del plan, contados desde que se confirma el pago. No se renueva solo. Si el anuncio incumple estas reglas lo retiramos y el tiempo destacado no se devuelve. Si hubo un cobro por error, escríbenos a contacto@alquilasya.com.",
    ],
  },
];

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-5 py-16 sm:px-8 lg:py-24">
      <p className="label text-terracota-700">Privacidad y términos</p>
      <h1 className="serif mt-4 text-[44px] leading-[0.98] sm:text-[60px]">
        Lo que guardamos y para qué.
      </h1>
      <p className="mt-5 text-[17px] leading-relaxed text-grafito-700">
        Versión preliminar, vigente durante el periodo previo al lanzamiento. La escribimos corta y
        en lenguaje llano a propósito.
      </p>
      <div className="mt-12 space-y-10">
        {SECTIONS.map((s) => (
          <section key={s.title} className="border-t border-piedra-250 pt-8">
            <h2 className="head text-[26px]">{s.title}.</h2>
            <ul className="mt-4 space-y-3 text-[16px] leading-relaxed text-grafito-700">
              {s.body.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
