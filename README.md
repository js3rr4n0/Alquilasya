# AlquilasYa

Alquileres en El Salvador con el precio total, el depósito, el plano y las
condiciones por escrito antes de contactar a nadie.

Next.js 16 (App Router) · Tailwind CSS 4 · Postgres (Neon) · Vercel Blob.

## Qué hace hoy

| Ruta | Qué es |
| --- | --- |
| `/` | Portada y buscador |
| `/explorar` | Resultados con filtros y mapa |
| `/casa/[id]` | Ficha: plano, condiciones, costos y «Escribir al propietario» |
| `/publicar` | Formulario guiado; el anuncio queda **en revisión** |
| `/lista` | Lista de espera |
| `/admin` | Moderación: publicar, pausar o rechazar anuncios; leer mensajes |
| `/mensajes`, `/expediente` | Vistas de demostración (próximamente) |

Los nueve anuncios que trae el sitio están marcados como **Ejemplo**. Los
anuncios reales viven en la base de datos y aparecen primero.

## Puesta en marcha en Vercel

1. **Storage → Create Database → Neon (Postgres)** y conéctala al proyecto.
   Crea sola la variable `DATABASE_URL`.
2. (Opcional) **Storage → Blob** para que quien publica pueda subir sus fotos.
   Crea sola `BLOB_READ_WRITE_TOKEN`. Sin ella se usan fotos de muestra.
3. En **Settings → Environment Variables** añade `ADMIN_TOKEN` (una clave larga
   y única, mínimo 12 caracteres) y `NEXT_PUBLIC_SITE_URL`.
4. Vuelve a desplegar. Las tablas se crean solas durante el build
   (`scripts/migrate.mjs`) y, por si acaso, en el primer acceso a la base.

Ver `.env.example` para la lista completa de variables.

## Base de datos

El esquema está en `db/schema.mjs` y es idempotente:

- `waitlist`: lista de espera.
- `listings`: anuncios (`status`: pendiente, publicada, rechazada, pausada);
  la ficha completa va en la columna `data` (JSONB).
- `inquiries`: mensajes de quien busca hacia quien publica.

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

## Marca

Logotipos oficiales en `public/brand/` y como componentes en `src/brand/`.
Por debajo de 200 px el logotipo va en una sola tinta; el texto del sitio no
baja de 14 px.
