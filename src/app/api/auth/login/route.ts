import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { login, loginInput } from "@/server/auth";
import { invalid, noDatabase, rateLimited, tooMany } from "@/server/http";

export async function POST(request: Request) {
  if (rateLimited(request, "login", 8)) return tooMany();
  if (!hasDatabase()) return noDatabase();
  const parsed = loginInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);
  try {
    const user = await login(parsed.data);
    if (!user) {
      return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/auth/login", error);
    return NextResponse.json(
      { error: "No pudimos iniciar tu sesión. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
