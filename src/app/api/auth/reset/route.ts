import { forgotInput, forgotPassword, resetInput, resetPassword } from "@/server/auth";
import { ipFingerprint } from "@/server/http";
import { endpoint } from "@/server/route";

/** Paso 1: pedir el código. Responde igual exista o no la cuenta. */
export const PUT = endpoint({
  scope: "forgot",
  max: 4,
  schema: forgotInput,
  run: async ({ request, input }) => {
    await forgotPassword(input.email, ipFingerprint(request));
    return { ok: true };
  },
});

/** Paso 2: código + contraseña nueva. Cierra las demás sesiones. */
export const POST = endpoint({
  scope: "reset",
  max: 10,
  schema: resetInput,
  run: async ({ input }) => ({ user: await resetPassword(input) }),
});
