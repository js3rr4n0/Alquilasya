import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/lib/db";
import { isAdmin, noDatabase } from "@/server/http";
import { adminOverview, setListingStatus } from "@/server/listings";

export const dynamic = "force-dynamic";

const denied = () => NextResponse.json({ error: "No autorizado." }, { status: 401 });

export async function GET(request: Request) {
  if (!isAdmin(request)) return denied();
  if (!hasDatabase()) return noDatabase();
  try {
    return NextResponse.json(await adminOverview());
  } catch (error) {
    console.error("GET /api/admin", error);
    return NextResponse.json({ error: "No se pudo leer la base de datos." }, { status: 500 });
  }
}

const action = z.object({
  id: z.string().min(1).max(120),
  status: z.enum(["pendiente", "publicada", "rechazada", "pausada"]),
});

export async function POST(request: Request) {
  if (!isAdmin(request)) return denied();
  if (!hasDatabase()) return noDatabase();
  const parsed = action.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  try {
    const ok = await setListingStatus(parsed.data.id, parsed.data.status);
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "Anuncio no encontrado." }, { status: 404 });
  } catch (error) {
    console.error("POST /api/admin", error);
    return NextResponse.json({ error: "No se pudo actualizar." }, { status: 500 });
  }
}
