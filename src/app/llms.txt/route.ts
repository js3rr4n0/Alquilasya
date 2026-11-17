import { GUIDES } from "@/data/guides";
import { departments } from "@/lib/geo";
import { abs, FAQ, SITE_DESCRIPTION } from "@/lib/site";

export const dynamic = "force-static";

/** Resumen del sitio para asistentes de IA (convención llms.txt). */
export function GET() {
  const body = `# AlquilasYa

> ${SITE_DESCRIPTION}

AlquilasYa es un portal de alquiler de viviendas en El Salvador (casas, apartamentos, lofts, cabañas y estudios). Su diferencia es que cada anuncio debe decir, antes del contacto: el precio total por plazo, el depósito, lo que incluye y lo que no, el plano con las medidas de cada espacio y once condiciones del alquiler (muebles, mascotas, invitados, fumar, uso comercial, eventos, niños, horas de silencio, estacionamiento, accesibilidad y subarriendo).

## Datos clave

- País: El Salvador. Cobertura: 14 departamentos, 44 municipios y 262 distritos.
- Precio: buscar y publicar es gratis. No hay comisión para quien busca ni para quien alquila.
- Pagos: AlquilasYa no recibe ni guarda dinero. El pago y el contrato se acuerdan directamente con el propietario.
- Plazos de alquiler: por día, semana, mes, seis meses o un año, según lo que ofrezca cada propietario.
- Contacto con el propietario: por el chat privado del sitio, desde una cuenta con el correo confirmado. Para buscar y ver anuncios no hace falta registrarse.
- Moderación: cada anuncio pasa un filtro automático (lenguaje ofensivo, discriminación, contacto fuera del sitio, señales de estafa) antes de publicarse; lo dudoso lo revisa una persona.
- Moneda: dólares estadounidenses (USD).

## Páginas principales

- [Inicio](${abs("/")}): qué es y cómo funciona.
- [Explorar alquileres](${abs("/explorar")}): resultados con filtros por zona, plazo, precio y condiciones, y mapa.
- [Publicar gratis](${abs("/anunciar")}): cómo anuncian los propietarios, sin costo ni comisión.
- [Privacidad y términos](${abs("/privacidad")})

## Guías

${GUIDES.map((g) => `- [${g.title}](${abs(`/guias/${g.slug}`)}): ${g.answer}`).join("\n")}

## Alquileres por departamento

${departments.map((d) => `- [Alquileres en ${d.name}](${abs(`/alquiler/${d.slug}`)})`).join("\n")}

## Preguntas frecuentes

${FAQ.map((f) => `### ${f.q}\n\n${f.a}`).join("\n\n")}

## Contacto

contacto@alquilasya.com
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
