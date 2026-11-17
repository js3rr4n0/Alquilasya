import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { currentUser } from "@/server/auth";
import { getListing } from "@/server/listings";

export const dynamic = "force-dynamic";

const notFound = () => NextResponse.json({ error: "No encontrada" }, { status: 404 });

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasDatabase()) return notFound();
  try {
    const user = await currentUser();
    const listing = await getListing(id, user?.id);
    return listing ? NextResponse.json({ listing }) : notFound();
  } catch (error) {
    console.error("GET /api/listings/[id]", error);
    return notFound();
  }
}
