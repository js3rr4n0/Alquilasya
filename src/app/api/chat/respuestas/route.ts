import { getReplies, repliesInput, saveReplies } from "@/server/chat";
import { endpoint } from "@/server/route";

export const dynamic = "force-dynamic";

/** Mis respuestas rápidas guardadas para el chat. */
export const GET = endpoint({
  scope: "chat-replies",
  max: 60,
  need: "user",
  run: async ({ user }) => ({ replies: await getReplies(user!.id) }),
});

/** Reemplaza la lista completa (agregar o quitar una). */
export const PUT = endpoint({
  scope: "chat-replies-save",
  max: 30,
  need: "verified",
  schema: repliesInput,
  run: async ({ user, input }) => ({ replies: await saveReplies(user!.id, input.replies) }),
});
