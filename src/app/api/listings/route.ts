import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { currentUser } from "@/server/auth";
import { invalid, noDatabase, rateLimited, refreshPublicPages, tooMany } from "@/server/http";
import { createListing, InputError, listingInput } from "@/server/listings";
import { searchListings, searchParams } from "@/server/search";

export const dynamic = "force-dynamic";

/**
 * Búsqueda de anuncios publicados, paginada. Sin base conectada responde vacío.
 * Ver los filtros en `src/server/search.ts`.
 */
export async function GET(request: Request) {
  const raw = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = searchParams.safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);
  const empty = { results: [], total: 0, page: 1, pages: 1, points: parsed.data.mapa === "1" ? [] : undefined };
  if (!hasDatabase()) return NextResponse.json({ ...empty, database: false });
  try {
    return NextResponse.json(await searchListings(parsed.data), {
      // La misma búsqueda se sirve desde la red de Vercel unos segundos.
      headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" },
    });
  } catch (error) {
    console.error("GET /api/listings", error);
    return NextResponse.json({ ...empty, error: "No pudimos buscar ahora." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (rateLimited(request, "listings", 4)) return tooMany();
  if (!hasDatabase()) return noDatabase();

  const user = await currentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para publicar." }, { status: 401 });
  }
  if (!user.verified) {
    return NextResponse.json(
      { error: "Confirma tu correo antes de publicar.", code: "sin_verificar" },
      { status: 403 },
    );
  }

  const raw = await request.text();
  if (raw.length > 300_000) {
    return NextResponse.json({ error: "El anuncio es demasiado grande." }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = listingInput.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const created = await createListing(parsed.data, user);
    refreshPublicPages();
    return NextResponse.json({ ...created, status: "pendiente" }, { status: 201 });
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/listings", error);
    return NextResponse.json(
      { error: "No pudimos guardar tu anuncio. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
