# AlquilasYa

Alquileres en El Salvador con el precio total, el depósito, el plano y las
condiciones por escrito antes de contactar a nadie.

Next.js 16 (App Router) · Tailwind CSS 4 · Postgres (Neon) · Vercel Blob.

## Qué hace hoy

| Ruta | Qué es |
| --- | --- |
| `/` | Portada, buscador y preguntas frecuentes |
| `/explorar` | Resultados con filtros por departamento y distrito, y mapa |
| `/alquiler/[zona]` | Página por departamento o distrito («Alquileres en Santa Tecla») |
| `/casa/[id]` | Ficha: plano, condiciones, costos y «Escribir al propietario» |
| `/entrar`, `/verificar`, `/cuenta` | Cuenta con correo y contraseña, confirmada con un código de 6 dígitos; panel con mis anuncios |
| `/mensajes` | Chat privado entre quien busca y quien publica |
| `/publicar` | Formulario guiado (pide cuenta); el anuncio queda **en revisión**. Con `?editar=` edita uno propio |
| `/anunciar`, `/guias` | Aterrizaje para propietarios y guías para buscadores y asistentes de IA |
| `/lista` | Lista de espera |
| `/admin` | Sala de control (solo cuentas en `ADMIN_EMAILS`): moderación, usuarios y totales |
| `/api/health` | Para un monitor externo: 200 si el sitio y la base responden |

La base arranca **sin propiedades**. Las casas de ejemplo solo ilustran la
portada; no aparecen en los resultados.

## Puesta en marcha en Vercel

1. **Storage → Create Database → Neon (Postgres)** y conéctala al proyecto.
   Crea sola la variable `DATABASE_URL`.
2. (Opcional) **Storage → Blob** para que quien publica pueda subir sus fotos.
   Elige acceso **Public**. Crea sola `BLOB_STORE_ID` (o `BLOB_READ_WRITE_TOKEN`). Sin almacén, los anuncios salen sin fotos.
3. **Correo**: crea una cuenta en Resend, verifica el dominio y añade
   `RESEND_API_KEY` y `MAIL_FROM`. Sin esto nadie puede confirmar su cuenta.
4. En **Settings → Environment Variables** añade `ADMIN_EMAILS` (tu correo),
   `NEXT_PUBLIC_SITE_URL` y, cuando verifiques el dominio en Search Console,
   `GOOGLE_SITE_VERIFICATION`.
5. Activa **Analytics** y **Speed Insights** en el proyecto de Vercel: el
   código ya está en el sitio.
6. Vuelve a desplegar. Las tablas se crean solas durante el build
   (`scripts/migrate.mjs`) y, por si acaso, en el primer acceso a la base.

Ver `.env.example` para la lista completa de variables.

## Base de datos

El esquema está en `db/schema.mjs` y es idempotente:

- `departments`, `municipalities`, `districts`: división territorial vigente
  (14, 44 y 262), cargada desde `db/geo.mjs` (fuente: GeoNames, CC BY 4.0).
- `users`, `sessions`, `email_codes`: cuentas. Contraseña con hash scrypt; la
  sesión es una cookie `httpOnly` y en la base solo se guarda su hash; los
  códigos de correo vencen en 15 minutos y admiten 5 intentos.
- `conversations`, `messages`: chat privado, una conversación por anuncio y
  persona interesada.
- `rate_events`: freno de intentos (entrar, códigos, chat) compartido entre
  instancias.
- `listings`: anuncios, ligados a su dueño y a su distrito, con el punto del
  mapa (`status`: pendiente, publicada, rechazada, pausada). La ficha completa
  va en la columna `data` (JSONB).
- `inquiries`: mensajes de quien busca hacia quien publica.
- `waitlist`: lista de espera.

```bash
npm run db:migrate   # crea o actualiza las tablas
```

### Empezar de cero sobre una base que ya existía

Para borrar **todo** (también la lista de espera anterior) y dejar solo el
esquema nuevo con la geografía cargada: añade en Vercel la variable `DB_RESET`
con un valor cualquiera, por ejemplo la fecha, y vuelve a desplegar. Cada valor
se aplica una sola vez; dejarla puesta no borra nada en los siguientes
despliegues. No se puede deshacer: exporta antes lo que quieras conservar.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y completa DATABASE_URL
npm run dev
```

Con un Postgres local (`postgres://usuario@localhost:5432/alquilasya`) se usa
el driver `pg`; con Neon, su driver HTTP.

## Posicionamiento

Sitemap, robots, datos estructurados, páginas por zona y `llms.txt` ya están
en el sitio. Los pasos manuales, las palabras clave y el plan de anuncios
están en [`docs/seo.md`](docs/seo.md).

## Cuentas, chat y seguridad

- Buscar y leer no pide registro. Publicar y chatear piden cuenta con el
  correo confirmado.
- El chat se guarda en la base y solo lo leen sus dos participantes. No es
  cifrado de extremo a extremo. La sala de admin cuenta mensajes, no los muestra.
- Protecciones: hash scrypt, sesiones revocables, límite de intentos, rechazo
  de peticiones de otro origen (`src/proxy.ts`), validación de toda entrada y
  consultas parametrizadas.
- Pendiente: política de contenido (CSP), bloqueo y reporte de usuarios en el
  chat, y una auditoría externa antes de manejar pagos.

## Marca

Logotipos oficiales en `public/brand/` y como componentes en `src/brand/`.
Por debajo de 200 px el logotipo va en una sola tinta; el texto del sitio no
baja de 14 px.
