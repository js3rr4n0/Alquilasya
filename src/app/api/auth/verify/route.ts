import { codeInput, resendVerification, verifyEmail } from "@/server/auth";
import { endpoint } from "@/server/route";

/** Confirma el correo con el código de 6 dígitos. */
export const POST = endpoint({
  scope: "verify",
  max: 10,
  need: "user",
  schema: codeInput,
  run: async ({ user, input }) => ({ user: await verifyEmail(user!, input.code) }),
});

/** Pide un código nuevo. */
export const PUT = endpoint({
  scope: "resend",
  max: 4,
  need: "user",
  run: async ({ user }) => {
    await resendVerification(user!);
    return { ok: true };
  },
});
