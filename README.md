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
| `/entrar`, `/cuenta` | Cuenta con correo y contraseña; panel con mis anuncios y mensajes |
| `/publicar` | Formulario guiado (pide cuenta); el anuncio queda **en revisión** |
| `/lista` | Lista de espera |
| `/admin` | Moderación: publicar, pausar o rechazar anuncios; leer mensajes |
| `/mensajes`, `/expediente` | Vistas de demostración (próximamente) |

La base arranca **sin propiedades**. Las casas de ejemplo solo ilustran la
portada; no aparecen en los resultados.

## Puesta en marcha en Vercel

1. **Storage → Create Database → Neon (Postgres)** y conéctala al proyecto.
   Crea sola la variable `DATABASE_URL`.
2. (Opcional) **Storage → Blob** para que quien publica pueda subir sus fotos.
   Crea sola `BLOB_READ_WRITE_TOKEN`. Sin ella se usan fotos de muestra.
3. En **Settings → Environment Variables** añade `ADMIN_TOKEN` (una clave larga
   y única, mínimo 12 caracteres), `NEXT_PUBLIC_SITE_URL` y, cuando verifiques
   el dominio en Search Console, `GOOGLE_SITE_VERIFICATION`.
4. Vuelve a desplegar. Las tablas se crean solas durante el build
   (`scripts/migrate.mjs`) y, por si acaso, en el primer acceso a la base.

Ver `.env.example` para la lista completa de variables.

## Base de datos

El esquema está en `db/schema.mjs` y es idempotente:

- `departments`, `municipalities`, `districts`: división territorial vigente
  (14, 44 y 262), cargada desde `db/geo.mjs` (fuente: GeoNames, CC BY 4.0).
- `users`, `sessions`: cuentas. Contraseña con hash scrypt; la sesión es una
  cookie `httpOnly` y en la base solo se guarda su hash.
- `listings`: anuncios, ligados a su dueño y a su distrito, con el punto del
  mapa (`status`: pendiente, publicada, rechazada, pausada). La ficha completa
  va en la columna `data` (JSONB).
- `inquiries`: mensajes de quien busca hacia quien publica.
- `waitlist`: lista de espera.

```bash
npm run db:migrate   # crea o actualiza las tablas
```

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

## Cuentas

No hay recuperación de contraseña por correo todavía (haría falta un proveedor
de envío). Mientras tanto se atiende a mano desde `hola@alquilasya.com`.

## Marca

Logotipos oficiales en `public/brand/` y como componentes en `src/brand/`.
Por debajo de 200 px el logotipo va en una sola tinta; el texto del sitio no
baja de 14 px.
