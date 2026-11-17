import { NextResponse } from "next/server";
import { currentUser, profileInput, updateProfile } from "@/server/auth";
import { invalid } from "@/server/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ user: await currentUser() });
  } catch (error) {
    console.error("GET /api/auth/me", error);
    return NextResponse.json({ user: null });
  }
}

export async function PATCH(request: Request) {
  const user = await currentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  const parsed = profileInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return invalid(parsed.error);
  return NextResponse.json({ user: await updateProfile(user.id, parsed.data) });
}
