/**
 * Guías de AlquilasYa. Cada una responde una pregunta concreta, con la
 * respuesta en el primer párrafo. No llevan cifras de mercado ni afirmaciones
 * legales específicas: lo que no se puede respaldar no se escribe.
 */
export type Guide = {
  slug: string;
  title: string;
  /** Para el buscador y la tarjeta al compartir. */
  description: string;
  /** La respuesta corta, en una o dos frases. */
  answer: string;
  updated: string;
  sections: { heading: string; paragraphs?: string[]; list?: string[] }[];
  faq: { q: string; a: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "que-preguntar-antes-de-alquilar",
    title: "Qué preguntar antes de alquilar una casa o apartamento en El Salvador",
    description:
      "Lista de preguntas para hacer antes de visitar y antes de firmar: costo total, depósito, servicios, reglas y estado del inmueble.",
    answer:
      "Antes de visitar, pregunta por el costo total mensual, el depósito, qué servicios incluye y las reglas sobre mascotas, visitas y parqueo. Antes de firmar, pide que todo eso quede por escrito y revisa el inmueble con calma.",
    updated: "2026-11-17",
    sections: [
      {
        heading: "Sobre el dinero",
        list: [
          "¿Cuánto es la renta y qué incluye exactamente: agua, luz, internet, vigilancia, cuota de la colonia?",
          "¿Cuánto hay que entregar el primer día, sumando renta y depósito?",
          "¿De cuánto es el depósito, en qué casos se descuenta y cuándo se devuelve?",
          "¿Quién paga las reparaciones y el mantenimiento: pintura, plomería, jardín?",
          "¿La renta puede subir durante el contrato? ¿Cuándo y cuánto?",
        ],
      },
      {
        heading: "Sobre las condiciones",
        list: [
          "¿Cuál es el plazo mínimo y qué pasa si necesito irme antes?",
          "¿Se aceptan mascotas? ¿De qué tamaño y cuántas?",
          "¿Pueden quedarse invitados a dormir?",
          "¿Viene amueblado? ¿Con qué exactamente?",
          "¿Hay parqueo? ¿Para cuántos vehículos y es techado?",
          "¿Se puede trabajar desde casa o recibir clientes?",
          "¿Hay horario de silencio o reglas del residencial?",
        ],
      },
      {
        heading: "Sobre el inmueble, durante la visita",
        list: [
          "Abre los grifos y la ducha: revisa presión y si hay agua caliente.",
          "Pregunta si el agua llega todos los días y si hay cisterna o tanque.",
          "Prueba interruptores, tomacorrientes y la señal del teléfono.",
          "Busca humedad en techos y paredes, sobre todo en baños y closets.",
          "Mira cerraduras, portones y cómo es el acceso de noche.",
          "Visita a distintas horas si puedes: ruido, tráfico y calor cambian.",
        ],
      },
      {
        heading: "Antes de firmar",
        paragraphs: [
          "Pide el contrato por escrito y léelo completo. Lo que se acordó de palabra y no aparece en el contrato es difícil de reclamar después. Si algo no queda claro, consulta con un abogado antes de firmar.",
          "Toma fotos del estado en que recibes el inmueble y compártelas con el propietario ese mismo día. Sirven a los dos cuando llegue el momento de devolver el depósito.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Qué es lo más importante que debo preguntar?",
        a: "El costo total: renta más servicios, y cuánto hay que entregar el primer día. Es la diferencia más frecuente entre lo que dice un anuncio y lo que se termina pagando.",
      },
      {
        q: "¿Conviene pagar antes de visitar?",
        a: "No. Visita el inmueble, confirma que quien lo alquila tiene derecho a hacerlo y firma antes de entregar dinero.",
      },
    ],
  },
  {
    slug: "deposito-de-alquiler",
    title: "Depósito de alquiler en El Salvador: qué es y qué dejar por escrito",
    description:
      "Qué es el depósito de alquiler, para qué sirve y qué acordar por escrito para recuperarlo sin problemas al terminar el contrato.",
    answer:
      "El depósito es una suma que el inquilino entrega al inicio como garantía por daños o pagos pendientes, y que el propietario devuelve al terminar el contrato si no hay nada que descontar. El monto y las condiciones de devolución se acuerdan entre las partes y deben quedar por escrito.",
    updated: "2026-11-17",
    sections: [
      {
        heading: "Para qué sirve",
        paragraphs: [
          "Protege al propietario si al final del contrato hay daños que van más allá del uso normal, o rentas y servicios sin pagar. No es un pago adicional ni la última renta, salvo que así se acuerde expresamente.",
        ],
      },
      {
        heading: "Qué acordar por escrito",
        list: [
          "El monto exacto y la fecha en que se entregó, con recibo.",
          "En qué casos se puede descontar y cómo se comprueba el daño.",
          "Qué se considera desgaste normal y no se cobra.",
          "El plazo para devolverlo después de entregar las llaves.",
          "Si puede o no usarse para cubrir la última renta.",
        ],
      },
      {
        heading: "Cómo cuidar el depósito",
        list: [
          "Al entrar, fotografía cada espacio y envía las fotos al propietario con fecha.",
          "Avisa por escrito de cualquier desperfecto en cuanto aparezca.",
          "Guarda los comprobantes de pago de renta y servicios.",
          "Al salir, recorran juntos el inmueble y dejen constancia de cómo se entrega.",
        ],
      },
      {
        heading: "Si hay desacuerdo",
        paragraphs: [
          "Las fotos de entrada y de salida y el contrato son la base para resolverlo. Si no hay acuerdo, busca asesoría legal: esta guía es orientación general y no sustituye el consejo de un abogado.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Cuánto se pide de depósito?",
        a: "Lo define cada propietario y debe aparecer en el anuncio. En AlquilasYa el depósito es un dato obligatorio de cada ficha, junto con el total que hay que entregar para entrar.",
      },
      {
        q: "¿El depósito se puede usar como último mes de renta?",
        a: "Solo si el contrato lo permite. Si no dice nada, lo habitual es que el depósito se devuelva aparte, después de revisar el inmueble.",
      },
    ],
  },
  {
    slug: "alquilar-con-mascotas",
    title: "Alquilar con mascotas en El Salvador: qué preguntar y cómo acordarlo",
    description:
      "Cómo encontrar alquiler que acepte mascotas, qué preguntar antes de visitar y qué dejar por escrito para evitar problemas.",
    answer:
      "Filtra desde el inicio por anuncios que acepten mascotas, pregunta por tamaño, cantidad y áreas permitidas, y pide que la autorización quede escrita en el contrato. Un permiso solo de palabra no te protege.",
    updated: "2026-11-17",
    sections: [
      {
        heading: "Qué preguntar",
        list: [
          "¿Se aceptan perros, gatos o ambos? ¿Cuántos?",
          "¿Hay límite de tamaño o de raza?",
          "¿Hay un depósito adicional por mascota? ¿Es reembolsable?",
          "¿El patio o jardín está cerrado?",
          "¿El residencial o el edificio tiene su propio reglamento sobre mascotas?",
          "¿Qué pasa con los daños: quién los repara y cómo se cobran?",
        ],
      },
      {
        heading: "Cómo presentarte",
        paragraphs: [
          "A muchos propietarios les preocupa el ruido, los olores y los daños. Ayuda decir desde el primer mensaje qué mascota tienes, su tamaño y edad, y que tiene sus vacunas al día. Ofrecer referencias de un alquiler anterior suele abrir puertas.",
        ],
      },
      {
        heading: "Qué dejar por escrito",
        list: [
          "Que la mascota está autorizada, con su descripción.",
          "El depósito adicional, si lo hay, y cuándo se devuelve.",
          "Las áreas donde puede estar.",
          "Quién responde por daños y limpieza al terminar.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Cómo sé si un alquiler acepta mascotas antes de escribir?",
        a: "En AlquilasYa cada anuncio responde de forma obligatoria si acepta mascotas: sí, no o con condiciones, y cuáles. También puedes filtrar los resultados por «Acepta mascotas».",
      },
    ],
  },
  {
    slug: "alquilar-desde-el-extranjero",
    title: "Cómo alquilar una casa en El Salvador desde el extranjero",
    description:
      "Pasos para alquilar a distancia con seguridad si vives fuera de El Salvador: qué pedir, cómo verificar y qué no hacer.",
    answer:
      "Se puede, con tres cuidados: pide toda la información por escrito antes de avanzar, haz que alguien de confianza visite el inmueble por ti y no envíes dinero hasta tener un contrato firmado con quien demuestre que puede alquilarlo.",
    updated: "2026-11-17",
    sections: [
      {
        heading: "Paso a paso",
        list: [
          "Define zona, presupuesto total y plazo. Si vuelves por temporadas, busca anuncios que ofrezcan semanas o meses.",
          "Pide el costo total, el depósito, lo que incluye y las reglas, todo por escrito.",
          "Pide una videollamada recorriendo el inmueble, incluidos baños, cocina y la calle.",
          "Envía a un familiar o amigo a visitarlo y a conocer a quien alquila.",
          "Pide el contrato para leerlo con calma antes de firmar.",
          "Paga por un medio que deje comprobante, a nombre de quien firma el contrato.",
        ],
      },
      {
        heading: "Señales de alerta",
        list: [
          "Precio muy por debajo de la zona y prisa por cerrar.",
          "Quien alquila dice estar fuera del país y no puede mostrar el inmueble.",
          "Piden un anticipo para «apartar» antes de cualquier visita.",
          "Se niegan a una videollamada o a que alguien lo visite.",
          "El nombre de quien recibe el dinero no coincide con el del contrato.",
        ],
      },
      {
        heading: "Si alquilas para un familiar",
        paragraphs: [
          "Aclara desde el principio quién vivirá en el inmueble y quién paga. Conviene que ambas personas aparezcan en el contrato para que no haya dudas sobre quién responde.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Puedo alquilar por pocos meses si solo vengo de visita?",
        a: "Depende del propietario. En AlquilasYa cada anuncio dice qué plazos acepta: día, semana, mes, seis meses o un año, y el precio de cada uno.",
      },
      {
        q: "¿AlquilasYa recibe el pago?",
        a: "No. AlquilasYa publica los anuncios y pone en contacto a las partes. El pago y el contrato se acuerdan directamente con el propietario.",
      },
    ],
  },
  {
    slug: "evitar-estafas-de-alquiler",
    title: "Cómo evitar estafas al alquilar en El Salvador",
    description:
      "Las señales más comunes de un anuncio de alquiler falso y los pasos para protegerte antes de pagar o enviar documentos.",
    answer:
      "No pagues ni envíes documentos antes de visitar el inmueble y de confirmar que quien lo ofrece puede alquilarlo. Casi todas las estafas de alquiler dependen de conseguir un anticipo a distancia.",
    updated: "2026-11-17",
    sections: [
      {
        heading: "Señales de un anuncio falso",
        list: [
          "El precio es mucho menor que el de inmuebles parecidos en la zona.",
          "Las fotos parecen de catálogo o aparecen en otros anuncios con otra dirección.",
          "Te piden un depósito para «reservar» o para «enviarte las llaves».",
          "No pueden mostrarlo en persona ni por videollamada.",
          "Hay urgencia: «hay otra persona interesada, decida hoy».",
          "Evitan responder preguntas concretas o cambian la versión.",
        ],
      },
      {
        heading: "Qué hacer siempre",
        list: [
          "Visita el inmueble, por dentro, antes de entregar dinero.",
          "Pide ver un documento que respalde que quien alquila es el dueño o tiene autorización.",
          "Firma un contrato antes de pagar y exige recibo.",
          "Paga por un medio que deje comprobante, no en efectivo sin recibo.",
          "Desconfía si te piden seguir la conversación con prisa por otro canal y pagar de inmediato.",
        ],
      },
      {
        heading: "Si ya pagaste y sospechas",
        paragraphs: [
          "Guarda mensajes, comprobantes y el anuncio. Avisa a tu banco de inmediato y presenta la denuncia ante las autoridades. Si el anuncio estaba en AlquilasYa, escríbenos a contacto@alquilasya.com para retirarlo.",
        ],
      },
    ],
    faq: [
      {
        q: "¿AlquilasYa revisa los anuncios?",
        a: "Sí. Cada anuncio pasa un filtro automático antes de mostrarse (lenguaje ofensivo, discriminación, contacto fuera del sitio y señales de estafa), lo dudoso lo revisa una persona y quien publica debe confirmar su correo. Eso reduce el riesgo, pero no reemplaza visitar el inmueble y verificar a la otra parte antes de pagar.",
      },
    ],
  },
  {
    slug: "como-publicar-un-buen-anuncio-de-alquiler",
    title: "Cómo publicar un buen anuncio de alquiler y recibir menos preguntas repetidas",
    description:
      "Qué debe decir un anuncio de alquiler para atraer a la persona correcta: precio total, depósito, condiciones, fotos y plano.",
    answer:
      "Di todo desde el inicio: el precio total, el depósito, lo que incluye y lo que no, y las reglas. Un anuncio completo recibe menos mensajes, pero de personas a las que el inmueble sí les sirve.",
    updated: "2026-11-17",
    sections: [
      {
        heading: "Lo que no puede faltar",
        list: [
          "El precio que de verdad se paga, por cada plazo que aceptas.",
          "El depósito y cuánto hay que entregar el primer día.",
          "Qué servicios incluye y cuáles van aparte.",
          "Lo que no tiene: sin muebles, sin parqueo, sin agua caliente. Decirlo evita visitas perdidas.",
          "Las condiciones: mascotas, invitados, fumar, uso comercial, horario de silencio.",
          "La zona y un punto de referencia en el mapa.",
        ],
      },
      {
        heading: "Fotos y plano",
        list: [
          "Fotos con luz natural, sin filtros ni texto encima.",
          "Al menos una foto de cada espacio, incluidos baños y cocina.",
          "Si hay terraza o balcón, la vista.",
          "Las medidas de cada cuarto: ahorran la pregunta «¿cabe mi cama?».",
        ],
      },
      {
        heading: "Al responder",
        paragraphs: [
          "Contesta pronto y con datos. Si el inmueble ya se alquiló, pausa el anuncio el mismo día: nadie quiere visitar algo que ya no está disponible.",
        ],
      },
    ],
    faq: [
      {
        q: "¿Cuánto cuesta publicar en AlquilasYa?",
        a: "Nada. Publicar es gratis y no se cobra comisión por alquilar.",
      },
      {
        q: "¿Puedo cambiar mi anuncio después de publicarlo?",
        a: "Sí. Desde tu cuenta puedes editarlo, pausarlo, reactivarlo o borrarlo cuando quieras.",
      },
    ],
  },
];

export const getGuide = (slug: string) => GUIDES.find((g) => g.slug === slug);
