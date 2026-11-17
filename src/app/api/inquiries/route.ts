import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { invalid, noDatabase, rateLimited, tooMany } from "@/server/http";
import { createInquiry, InputError, inquiryInput } from "@/server/listings";

export async function POST(request: Request) {
  if (rateLimited(request, "inquiries", 6)) return tooMany();
  if (!hasDatabase()) return noDatabase();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const parsed = inquiryInput.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);

  try {
    const { owner } = await createInquiry(parsed.data);
    return NextResponse.json({ ok: true, owner }, { status: 201 });
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("POST /api/inquiries", error);
    return NextResponse.json(
      { error: "No pudimos enviar tu mensaje. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
