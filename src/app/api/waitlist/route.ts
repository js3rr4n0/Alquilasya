import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase, isUniqueViolation, query } from "@/lib/db";
import { invalid, noDatabase, rateLimited, tooMany } from "@/server/http";

const waitlistSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(100, "El nombre es demasiado largo"),
  whatsapp: z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "Número de WhatsApp inválido"),
  tipo_usuario: z.enum(["inquilino", "propietario"], {
    message: "Indica si buscas o publicas",
  }),
  departamento: z.string().min(2, "Selecciona un departamento").max(100),
  email: z.string().email("Debe ser un correo electrónico válido").max(255),
  origen: z.string().max(60).optional().default("organico"),
});

export async function POST(request: Request) {
  if (rateLimited(request, "waitlist", 5)) return tooMany();
  if (!hasDatabase()) return noDatabase();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) return invalid(parsed.error);
  const { nombre, whatsapp, tipo_usuario, departamento, email, origen } = parsed.data;

  try {
    await query(
      `INSERT INTO waitlist (nombre, whatsapp, tipo_usuario, departamento, email, origen)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nombre, whatsapp, tipo_usuario, departamento, email.toLowerCase(), origen],
    );
    return NextResponse.json(
      { success: true, message: "Listo. Te avisaremos antes del lanzamiento." },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: "Este correo ya está en la lista de espera." },
        { status: 409 },
      );
    }
    console.error("POST /api/waitlist", error);
    return NextResponse.json(
      { error: "Hubo un error al procesar tu solicitud. Intenta nuevamente." },
      { status: 500 },
    );
  }
}
