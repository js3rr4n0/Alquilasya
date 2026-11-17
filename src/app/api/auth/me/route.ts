import { NextResponse } from "next/server";
import { currentUser, profileInput, updateProfile } from "@/server/auth";
import { unreadCount } from "@/server/chat";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

/** Quién soy y cuántos mensajes tengo sin leer. Sin sesión responde `user: null`. */
export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({ user, unread: user ? await unreadCount(user.id) : 0 });
  } catch (error) {
    console.error("GET /api/auth/me", error);
    return NextResponse.json({ user: null, unread: 0 });
  }
}

export const PATCH = endpoint({
  scope: "profile",
  need: "user",
  schema: profileInput,
  run: async ({ user, input }) => ({ user: await updateProfile(user!.id, input) }),
});
