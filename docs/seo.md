# Posicionamiento de AlquilasYa: SEO, buscadores con IA y anuncios

Qué ya hace el sitio, qué hay que hacer a mano y con qué palabras competir.
Nadie puede garantizar el primer lugar en Google: depende de la oferta real de
anuncios, de los enlaces que reciba el sitio y del tiempo. Lo que sigue pone al
sitio en condiciones de competir por él.

## 1. Lo que el sitio ya hace solo

| Pieza | Dónde | Para qué |
| --- | --- | --- |
| `sitemap.xml` | `src/app/sitemap.ts` | Lista portada, departamentos, distritos con anuncios y cada ficha publicada. Se actualiza al aprobar, pausar o borrar. |
| `robots.txt` | `src/app/robots.ts` | Abre el sitio a Google y a los rastreadores de IA; cierra `/admin`, `/cuenta`, `/api`. |
| Páginas por zona | `/alquiler/[zona]` | Una página por departamento (14) y por distrito (262): «Alquileres en Santa Tecla». Los distritos sin anuncios llevan `noindex` para no llenar Google de páginas vacías; se indexan solos al recibir su primer anuncio. |
| Ficha con contenido en el HTML | `/casa/[id]` | Título «Casa en alquiler en Santa Tecla, La Libertad · $650 al mes», descripción, URL canónica e imagen para compartir. |
| Datos estructurados | JSON-LD | `Organization`, `WebSite` y `FAQPage` en la portada; `RealEstateListing` con precio y ubicación en cada ficha; `BreadcrumbList` e `ItemList` en las zonas. |
| Preguntas frecuentes | Portada | Respuestas cortas y completas: es el formato que citan los asistentes de IA. |
| `llms.txt` | `/llms.txt` | Resumen del sitio en texto plano para ChatGPT, Claude, Perplexity y similares. |
| 404 reales | Fichas y zonas inexistentes | Evita que Google indexe páginas de error. |
| Imagen al compartir | `/opengraph-image` | Vista previa en WhatsApp, Facebook y X. |
| Guías | `/guias` | Seis guías que responden una pregunta cada una, con la respuesta en el primer párrafo y datos `Article` y `FAQPage`. |
| Aterrizaje de propietarios | `/anunciar` | «Publica tu alquiler gratis»: destino de la campaña de propietarios. |
| Anuncios recientes en el HTML | Portada | Los últimos publicados llegan renderizados, sin depender de JavaScript. |
| Conversiones | `src/lib/track.ts` | Cuenta creada, correo verificado, anuncio enviado, mensaje enviado y lista de espera, hacia Vercel Analytics y GA4. |

## 2. Lo que hay que hacer a mano (una vez)

1. **Google Search Console** (search.google.com/search-console): añade la
   propiedad con el dominio, copia el código de verificación en la variable de
   entorno `GOOGLE_SITE_VERIFICATION` de Vercel y vuelve a desplegar. Luego
   envía `https://alquilasya.com/sitemap.xml` en «Sitemaps».
2. **Bing Webmaster Tools**: importa la propiedad desde Search Console. Bing
   alimenta a ChatGPT y a Copilot.
3. **Perfil de Empresa en Google** (business.google.com) con el mismo nombre,
   correo y dominio.
4. **Dominio único**: en Vercel, que `www` redirija al dominio principal (o al
   revés) y que `NEXT_PUBLIC_SITE_URL` sea exactamente ese.
5. **Redes**: Facebook, Instagram y TikTok con el mismo nombre y el enlace al
   sitio. Los grupos de Facebook de alquileres por zona son hoy donde está la
   demanda en El Salvador.

## 3. Lo que más pesa y no se programa

- **Anuncios reales.** Una página «Alquileres en Santa Tecla» con veinte
  fichas completas le gana a cualquier truco. Prioridad: llenar primero San
  Salvador, Santa Tecla y Antiguo Cuscatlán.
- **Enlaces desde sitios salvadoreños**: medios locales, blogs de mudanza y de
  extranjeros en El Salvador, directorios de la diáspora, universidades (bolsas
  de alojamiento).
- **Reseñas y menciones** con el nombre exacto «AlquilasYa».
- **Contenido útil** (ver punto 6).

## 4. Palabras clave

Agrupadas por intención. La zona se sustituye por cada distrito o departamento;
las páginas `/alquiler/[zona]` ya responden a ese patrón.

**Buscar para vivir (volumen alto, la batalla principal)**

- alquiler de casas en El Salvador
- casas en alquiler San Salvador
- apartamentos en alquiler San Salvador
- alquiler de apartamentos en El Salvador
- casas en alquiler Santa Tecla
- apartamentos en alquiler Santa Tecla
- alquiler Antiguo Cuscatlán
- casas en alquiler Santa Ana
- casas en alquiler San Miguel
- alquiler de casas en Soyapango / Mejicanos / Apopa / Ilopango
- casas en alquiler en colonia Escalón / San Benito / Merliot

**Con atributo (menos volumen, más intención)**

- apartamentos amueblados en San Salvador
- casas en alquiler baratas en San Salvador
- alquiler de casas económicas en El Salvador
- apartamentos en alquiler que aceptan mascotas
- casas en alquiler con cochera
- alquiler de habitaciones en San Salvador
- alquiler de casa por mes / alquiler temporal El Salvador
- casas en alquiler directo con dueño
- alquiler sin fiador El Salvador
- alquiler sin comisión

**Estancia corta**

- casas de playa en alquiler El Tunco / La Libertad
- alquiler de casas de playa El Salvador
- cabañas en alquiler Ruta de las Flores / Ataco / Coatepeque
- ranchos de playa en alquiler Costa del Sol

**Propietarios (traen la oferta)**

- publicar casa en alquiler gratis
- dónde anunciar mi casa en alquiler El Salvador
- cómo alquilar mi apartamento
- anunciar alquiler gratis

**Diáspora y extranjeros**

- rent house El Salvador
- apartments for rent San Salvador
- long term rentals El Salvador
- alquilar casa en El Salvador desde Estados Unidos

**Marca**

- AlquilasYa, alquilas ya, alquilasya.com

## 5. Anuncios pagados (SEM)

No están activos: requieren tu cuenta de Google Ads y presupuesto. Estructura
sugerida para empezar con poco:

| Campaña | Grupos de anuncios | Lleva a |
| --- | --- | --- |
| Búsqueda · Inquilinos | Uno por zona fuerte: San Salvador, Santa Tecla, Antiguo Cuscatlán | `/alquiler/<zona>` |
| Búsqueda · Propietarios | «publicar casa en alquiler gratis», «anunciar alquiler» | `/publicar` |
| Búsqueda · Marca | «alquilasya» | `/` |

- Segmentación: El Salvador; una segunda campaña pequeña para salvadoreños en
  Estados Unidos con las palabras de diáspora.
- Negativas desde el día uno: venta, comprar, terreno, lotes, hotel, airbnb,
  empleo, carros.
- Textos honestos, que son además la ventaja: «Precio total y depósito antes de
  contactar», «Sin comisión», «Publicar es gratis».
- No conviene pagar por inquilinos hasta tener oferta en esa zona: primero la
  campaña de propietarios.

### Medición (ya programada, falta conectarla)

1. Crea una propiedad de **Google Analytics 4** y pon su id (`G-…`) en la
   variable `NEXT_PUBLIC_GA_ID`. Opcional: el id de Google Ads (`AW-…`) en
   `NEXT_PUBLIC_GOOGLE_ADS_ID`.
2. En GA4 marca como **eventos clave**: `anuncio_enviado`, `mensaje_enviado`,
   `cuenta_creada` y `lista_espera`.
3. Vincula GA4 con Google Ads e **importa** esos eventos como conversiones.
4. En los enlaces de cada anuncio usa `utm_source`, `utm_medium` y
   `utm_campaign` para distinguir campañas en los informes.

Sin `NEXT_PUBLIC_GA_ID` el sitio no carga nada de Google ni usa cookies de
medición; las mismas conversiones se ven en Vercel Analytics.

### Textos listos para copiar (anuncios de búsqueda adaptables)

Títulos de hasta 30 caracteres y descripciones de hasta 90.

**Propietarios → `/anunciar`**

| Títulos | Descripciones |
| --- | --- |
| Publica tu alquiler gratis | Anuncia tu casa o apartamento sin pagar y sin comisión. Listo en minutos. |
| Anuncia tu casa sin comisión | Di el precio, el depósito y tus reglas. Te escribe quien sí puede alquilar. |
| Alquila tu apartamento | Formulario guiado con plano y fotos. Edita, pausa o borra cuando quieras. |
| Publicar es gratis. Siempre. | Recibe mensajes por el chat del sitio. Tu WhatsApp no aparece en el anuncio. |
| AlquilasYa El Salvador | |

**Inquilinos → `/alquiler/<zona>`** (cambia la zona en cada grupo)

| Títulos | Descripciones |
| --- | --- |
| Alquileres en Santa Tecla | Precio total, depósito y condiciones antes de escribir. Sin comisión. |
| Casas en alquiler | Mira el plano y las medidas de cada cuarto antes de visitar. |
| Apartamentos en alquiler | Filtra por mascotas, muebles y parqueo. Escribe directo al propietario. |
| Todo claro antes de entrar | Por día, semana, mes o año. Cada anuncio dice cuánto pagas para entrar. |
| Sin comisión ni intermediario | |

No uses «el mejor» ni «#1»: Google los rechaza sin respaldo de un tercero.

## 6. Contenido para buscadores con IA (GEO)

Los asistentes citan páginas que responden una pregunta concreta, con datos y
con fecha.

**Ya publicadas en `/guias`** (se editan en `src/data/guides.ts`): qué
preguntar antes de alquilar, el depósito, alquilar con mascotas, alquilar desde
el extranjero, cómo evitar estafas y cómo publicar un buen anuncio.

**Pendientes, porque necesitan datos o revisión legal:**

- Cuánto cuesta alquilar en San Salvador (rangos por zona, con fecha, a partir
  de los propios anuncios cuando haya suficientes).
- Qué debe decir un contrato de alquiler en El Salvador (con un abogado).
- Las mejores zonas para vivir en San Salvador según presupuesto.

Reglas: una pregunta por título, la respuesta en el primer párrafo, cifras con
fuente y fecha, y nada que el sitio no pueda sostener.
