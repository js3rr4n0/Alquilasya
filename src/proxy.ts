import { NextResponse, type NextRequest } from "next/server";

/**
 * Defensa contra peticiones entre sitios (CSRF): cualquier llamada a la API que
 * cambie algo debe venir del propio sitio. La cookie de sesión ya es
 * `SameSite=Lax`; esto es una segunda barrera.
 */
export function proxy(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return NextResponse.next();

  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      /* origen ilegible: se rechaza abajo */
    }
    if (originHost !== host) {
      return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
    }
  } else if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/api/:path*" };
