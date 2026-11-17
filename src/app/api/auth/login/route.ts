import { login, loginInput } from "@/server/auth";
import { endpoint } from "@/server/route";

export const POST = endpoint({
  scope: "login",
  max: 10,
  schema: loginInput,
  run: async ({ input }) => ({ user: await login(input) }),
});
