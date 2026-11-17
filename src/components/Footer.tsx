"use client";

import { Link } from "@/lib/router";
import { Lockup } from "../brand/Logo";
import { Container } from "./ui";

const SITE = [
  { to: "/explorar", label: "Explorar alquileres" },
  { to: "/anunciar", label: "Publicar gratis" },
  { to: "/guias", label: "Guías para alquilar" },
];

const ACCOUNT = [
  { to: "/entrar", label: "Entrar o crear cuenta" },
  { to: "/cuenta", label: "Mis anuncios" },
  { to: "/mensajes", label: "Mensajes" },
];

export function Footer() {
  return (
    <footer className="on-dark dots bg-negro text-crema-100">
      <Container className="pb-10 pt-20 lg:pt-28">
        <p className="serif max-w-[16ch] text-[44px] leading-[0.98] sm:text-[64px] lg:text-[84px]">
          Arriba, lo que se ve. Abajo, <em className="text-terracota-300">lo que es cierto.</em>
        </p>

        <div className="mt-20 grid gap-12 border-t border-crema-100/12 pt-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Lockup width={210} tone="crema" />
            <p className="mt-6 max-w-[34ch] text-[15px] leading-relaxed text-piedra-300">
              Alquileres en El Salvador con el precio total, el depósito y las condiciones por
              escrito antes de contactar a nadie.
            </p>
          </div>

          <nav aria-label="Sitio">
            <p className="label text-terracota-300">Sitio</p>
            <ul className="mt-5 space-y-2.5">
              {SITE.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="text-[15px] text-piedra-300 hover:text-crema-100">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Cuenta">
            <p className="label text-terracota-300">Cuenta</p>
            <ul className="mt-5 space-y-2.5">
              {ACCOUNT.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="text-[15px] text-piedra-300 hover:text-crema-100">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="label text-terracota-300">Cómo nos sostenemos</p>
            <p className="mt-5 text-[15px] leading-relaxed text-piedra-300">
              Publicar es gratis y no cobramos comisión. Más adelante, quien publique podrá pagar
              para destacar su anuncio, y siempre irá marcado como{" "}
              <span className="text-crema-100">Anuncio</span>.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-crema-100/12 pt-6 text-[14px] text-piedra-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 AlquilasYa · Todo claro antes de entrar.</p>
          <p className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/privacidad" className="hover:text-crema-100">
              Privacidad y términos
            </Link>
            <a href="mailto:contacto@alquilasya.com" className="hover:text-crema-100">
              contacto@alquilasya.com
            </a>
          </p>
        </div>
      </Container>
    </footer>
  );
}
