import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { register, registerInput } from "@/server/auth";
import { invalid, noDatabase, rateLimited, tooMany } from "@/server/http";

export async function POST(request: Request) {
  if (rateLimited(request, "register", 5)) return tooMany();
  if (!hasDatabase()) return noDatabase();
  const parsed = registerInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);
  try {
    const user = await register(parsed.data);
    if (!user) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo. Entra con tu contraseña." },
        { status: 409 },
      );
    }
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/register", error);
    return NextResponse.json(
      { error: "No pudimos crear tu cuenta. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
