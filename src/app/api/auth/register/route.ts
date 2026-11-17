import { NextResponse } from "next/server";
import { register, registerInput } from "@/server/auth";
import { endpoint } from "@/server/route";

export const POST = endpoint({
  scope: "register",
  max: 6,
  schema: registerInput,
  run: async ({ input }) => NextResponse.json(await register(input), { status: 201 }),
});
