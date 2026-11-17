import { NextResponse } from "next/server";
import { hasDatabase, query } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Para un monitor externo (UptimeRobot, Better Stack…): 200 si el sitio y la base responden. */
export async function GET() {
  if (!hasDatabase()) return NextResponse.json({ ok: false, database: "sin conectar" }, { status: 503 });
  try {
    await query("SELECT 1");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, database: "sin respuesta" }, { status: 503 });
  }
}
