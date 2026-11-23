import { NextResponse } from "next/server";
import { register, registerInput } from "@/server/auth";
import { ipFingerprint } from "@/server/http";
import { endpoint } from "@/server/route";

export const POST = endpoint({
  scope: "register",
  max: 6,
  schema: registerInput,
  run: async ({ request, input }) =>
    NextResponse.json(await register(input, ipFingerprint(request)), { status: 201 }),
});
