import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/server/auth";
import { refreshPublicPages } from "@/server/http";
import { accountOverview, ownerAction } from "@/server/listings";

export const dynamic = "force-dynamic";

const denied = () => NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

/** Panel de quien publica: sus anuncios y los mensajes que recibió. */
export async function GET() {
  const user = await currentUser().catch(() => null);
  if (!user) return denied();
  try {
    return NextResponse.json({ user, ...(await accountOverview(user.id)) });
  } catch (error) {
    console.error("GET /api/account", error);
    return NextResponse.json({ error: "No pudimos cargar tu panel." }, { status: 500 });
  }
}

const action = z.object({
  id: z.string().min(1).max(120),
  action: z.enum(["pausar", "reactivar", "borrar"]),
});

export async function POST(request: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return denied();
  const parsed = action.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  try {
    const ok = await ownerAction(user.id, parsed.data.id, parsed.data.action);
    if (ok) refreshPublicPages();
    return ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: "No se pudo aplicar el cambio." }, { status: 409 });
  } catch (error) {
    console.error("POST /api/account", error);
    return NextResponse.json({ error: "No se pudo aplicar el cambio." }, { status: 500 });
  }
}
