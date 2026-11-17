import { NextResponse } from "next/server";
import type { z, ZodType } from "zod";
import { hasDatabase } from "@/lib/db";
import { AuthError, currentUser, type User } from "./auth";
import { invalid, noDatabase, rateLimited, tooMany } from "./http";
import { MailError } from "./mail";

type Need = "anyone" | "user" | "verified" | "admin";

/**
 * Molde común de las rutas de la API: freno de ráfagas, base conectada,
 * permiso, validación del cuerpo y errores con mensaje para la persona.
 */
export function endpoint<S extends ZodType | undefined>(options: {
  scope: string;
  max?: number;
  need?: Need;
  schema?: S;
  run: (ctx: {
    request: Request;
    user: User | null;
    input: S extends ZodType ? z.infer<S> : undefined;
  }) => Promise<Response | Record<string, unknown>>;
}) {
  return async function handler(request: Request) {
    if (rateLimited(request, options.scope, options.max ?? 20)) return tooMany();
    if (!hasDatabase()) return noDatabase();

    try {
      const need = options.need ?? "anyone";
      const user = await currentUser();
      if (need !== "anyone" && !user) {
        return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
      }
      if (need === "verified" && !user!.verified) {
        return NextResponse.json(
          { error: "Confirma tu correo para continuar.", code: "sin_verificar" },
          { status: 403 },
        );
      }
      // A quien no es admin se le responde como si la ruta no existiera.
      if (need === "admin" && !user!.admin) {
        return NextResponse.json({ error: "No encontrado." }, { status: 404 });
      }

      let input: unknown;
      if (options.schema) {
        const parsed = options.schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return invalid(parsed.error);
        input = parsed.data;
      }

      const result = await options.run({ request, user, input: input as never });
      return result instanceof Response ? result : NextResponse.json(result);
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof MailError) {
        return NextResponse.json({ error: error.message }, { status: 503 });
      }
      console.error(`API ${options.scope}`, error);
      return NextResponse.json(
        { error: "Algo falló de nuestro lado. Intenta de nuevo." },
        { status: 500 },
      );
    }
  };
}
