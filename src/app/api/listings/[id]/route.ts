import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { currentUser } from "@/server/auth";
import { refreshPublicPages } from "@/server/http";
import {
  getListing,
  getListingForEdit,
  InputError,
  listingInput,
  updateListing,
} from "@/server/listings";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "No encontrada" }, { status: 404 });

/**
 * La ficha pública. Con `?editar=1` devuelve además los datos de contacto,
 * y solo a quien publicó el anuncio.
 */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  if (!hasDatabase()) return notFound();
  try {
    const user = await currentUser();
    if (new URL(request.url).searchParams.get("editar")) {
      const own = user ? await getListingForEdit(id, user.id, user.admin) : null;
      return own ? NextResponse.json(own) : notFound();
    }
    const listing = await getListing(id, user?.id, user?.admin);
    return listing ? NextResponse.json({ listing }) : notFound();
  } catch (error) {
    console.error("GET /api/listings/[id]", error);
    return notFound();
  }
}

/** Editar un anuncio propio. */
export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  return endpoint({
    scope: "listing-edit",
    max: 12,
    need: "verified",
    schema: listingInput,
    run: async ({ user, input }) => {
      try {
        const updated = await updateListing(id, input, user!);
        if (!updated) return notFound();
        refreshPublicPages();
        return updated;
      } catch (error) {
        if (error instanceof InputError) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        throw error;
      }
    },
  })(request);
}
