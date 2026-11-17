import { NextResponse } from "next/server";
import { listConversations, startConversation, startInput } from "@/server/chat";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

/** Mis conversaciones. */
export const GET = endpoint({
  scope: "chat-list",
  max: 120,
  need: "user",
  run: async ({ user }) => ({ conversations: await listConversations(user!.id) }),
});

/** Escribir por primera vez sobre un anuncio. */
export const POST = endpoint({
  scope: "chat-start",
  max: 15,
  need: "verified",
  schema: startInput,
  run: async ({ user, input }) =>
    NextResponse.json(await startConversation(user!, input), { status: 201 }),
});
