import { login, loginInput } from "@/server/auth";
import { ipFingerprint } from "@/server/http";
import { endpoint } from "@/server/route";

export const POST = endpoint({
  scope: "login",
  max: 10,
  schema: loginInput,
  run: async ({ request, input }) => ({ user: await login(input, ipFingerprint(request)) }),
});
