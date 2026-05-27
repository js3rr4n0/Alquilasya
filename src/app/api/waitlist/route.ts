import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// We define the validation schema using Zod for robust server-side validation
// This schema ensures only expected data structures are processed
const waitlistSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
  whatsapp: z.string().min(8, 'Número de WhatsApp inválido').max(30, 'Número de WhatsApp inválido'),
  tipo_usuario: z.enum(['inquilino', 'propietario'], {
    message: 'Debe seleccionar si es inquilino o propietario',
  }),
  departamento: z.string().min(2, 'Debe seleccionar un departamento').max(100),
  email: z.string().email('Debe ser un correo electrónico válido').max(255),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validation phase
    const validationResult = waitlistSchema.safeParse(body);
    
    if (!validationResult.success) {
      // Mapping Zod errors to a readable format
      const errors = validationResult.error.issues.map(err => err.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { nombre, whatsapp, tipo_usuario, departamento, email } = validationResult.data;

    // 2. Database Connection Phase
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is missing.');
      return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
    const sql = neon(process.env.DATABASE_URL);

    // 3. Secure Execution Phase
    // Using tagged template literals to enforce parameterized queries.
    // This entirely mitigates SQL injection risks.
    await sql`
      INSERT INTO waitlist (nombre, whatsapp, tipo_usuario, departamento, email)
      VALUES (${nombre}, ${whatsapp}, ${tipo_usuario}, ${departamento}, ${email})
    `;

    // 4. Success Response
    return NextResponse.json(
      { success: true, message: '¡Te has unido a la waitlist correctamente!' },
      { status: 201 }
    );
  } catch (error: any) {
    // Handling PostgreSQL Unique Constraint Violation for duplicate emails
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Este correo electrónico ya se encuentra registrado en nuestra waitlist.' },
        { status: 409 }
      );
    }
    
    // Fallback for unhandled exceptions
    console.error('Error processing waitlist registration:', error);
    return NextResponse.json(
      { error: 'Hubo un error al procesar tu solicitud. Intenta nuevamente.' },
      { status: 500 }
    );
  }
}
