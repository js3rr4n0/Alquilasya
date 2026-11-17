import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { getListing } from "@/server/listings";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDatabase()) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  try {
    const token = new URL(request.url).searchParams.get("token");
    const listing = await getListing(id, token);
    if (!listing) return NextResponse.json({ error: "No encontrada" }, { status: 404 });
    return NextResponse.json({ listing });
  } catch (error) {
    console.error("GET /api/listings/[id]", error);
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
}
