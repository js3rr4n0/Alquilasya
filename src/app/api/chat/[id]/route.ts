import { readConversation, sendInput, sendMessage } from "@/server/chat";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

/** Mensajes de una conversación en la que participo. `?after=` trae solo los nuevos. */
export async function GET(request: Request, { params }: Context) {
  const { id } = await params;
  return endpoint({
    scope: "chat-read",
    max: 240,
    need: "user",
    run: async ({ user }) =>
      readConversation(user!, id, new URL(request.url).searchParams.get("after") ?? "0"),
  })(request);
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  return endpoint({
    scope: "chat-send",
    max: 40,
    need: "verified",
    schema: sendInput,
    run: async ({ user, input }) => {
      await sendMessage(user!, id, input.body);
      return { ok: true };
    },
  })(request);
}
