import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { currentUser } from "@/server/auth";
import { invalid, noDatabase, rateLimited, tooMany } from "@/server/http";
import { createListing, InputError, listingInput, listPublished } from "@/server/listings";

export const dynamic = "force-dynamic";

/** Anuncios publicados. Sin base conectada responde vacío, no error. */
export async function GET() {
  if (!hasDatabase()) return NextResponse.json({ listings: [], database: false });
  try {
    return NextResponse.json({ listings: await listPublished(), database: true });
  } catch (error) {
    console.error("GET /api/listings", error);
    return NextResponse.json({ listings: [], database: false });
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
