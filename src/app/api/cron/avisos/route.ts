import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { sendDailyNotices } from "@/server/notices";

export const dynamic = "force-dynamic";

/**
 * La llama Vercel Cron una vez al día (ver vercel.json). Con CRON_SECRET definido,
 * Vercel manda `Authorization: Bearer <CRON_SECRET>` y se exige. Sin él, se acepta
 * solo el agente de Vercel Cron: lo peor que puede hacer otro es adelantar avisos
 * que igual se mandan una sola vez.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorized = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : (request.headers.get("user-agent") ?? "").startsWith("vercel-cron");
  if (!authorized) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ ok: false });
  try {
    return NextResponse.json({ ok: true, ...(await sendDailyNotices()) });
  } catch (error) {
    console.error("cron avisos", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
