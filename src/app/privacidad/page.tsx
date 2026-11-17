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
      "Al escribirle a quien publica: tu nombre, tu WhatsApp y el mensaje. Si usas el chat, los mensajes que envías y recibes.",
      "En tu navegador se guardan tus casas favoritas y una cookie de sesión para mantenerte dentro de tu cuenta. No usamos cookies de publicidad. Medimos visitas y velocidad con Vercel Analytics, que no usa cookies ni identifica a las personas. Si activamos Google Analytics o Google Ads para medir campañas, esos servicios sí usan cookies.",
    ],
  },
  {
    title: "Para qué los usamos",
    body: [
      "Para avisarte del lanzamiento, revisar los anuncios antes de publicarlos y poner en contacto a quien busca con quien publica.",
      "Tu WhatsApp como anunciante solo se muestra a quien ya te envió un mensaje desde tu ficha.",
      "Los mensajes del chat solo los ven sus dos participantes. No están cifrados de extremo a extremo: se guardan en nuestra base de datos y podemos revisarlos únicamente ante una denuncia o una obligación legal.",
      "No vendemos ni cedemos tus datos a terceros.",
    ],
  },
  {
    title: "Cómo pedir la baja o una corrección",
    body: [
      "Escribe a hola@alquilasya.com desde el correo que registraste. Borramos o corregimos tus datos y retiramos tu anuncio si lo pides.",
    ],
  },
  {
    title: "Términos de uso",
    body: [
      "AlquilasYa publica anuncios y pone en contacto a las partes. No es parte del contrato de alquiler, no recibe ni custodia pagos y no garantiza el estado de los inmuebles.",
      "Quien publica responde por que la información de su anuncio sea cierta y por tener derecho a alquilar el inmueble. Retiramos los anuncios falsos, engañosos o ilegales.",
      "Las casas marcadas como «Ejemplo» en la portada son ilustrativas: no corresponden a inmuebles disponibles.",
      "Antes de pagar o firmar, visita el inmueble y verifica a la otra parte.",
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
