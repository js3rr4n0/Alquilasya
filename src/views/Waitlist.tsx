"use client";

import WaitlistForm from "../components/WaitlistForm";
import { Container, Folio } from "../components/ui";
import { useSearchParams } from "@/lib/router";

const PROMISES = [
  {
    title: "Costo total",
    text: "Renta más servicios estimados, y cuánto hace falta el primer día.",
  },
  {
    title: "Condiciones",
    text: "Depósito, duración mínima, mascotas, visitas y uso comercial.",
  },
  {
    title: "Lo que no incluye",
    text: "Sin muebles, sin parqueo, sin agua caliente. La omisión también engaña.",
  },
];

export function Waitlist() {
  const [params] = useSearchParams();
  const tipo = params.get("soy") === "propietario" ? "propietario" : undefined;
  return (
    <div>
      <section className="on-dark dots bg-negro pb-14 pt-8 text-crema-100 lg:pb-20">
        <Container>
          <Folio left="Alquiler en El Salvador" right="Próximamente" tone="dark" />
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1fr_480px] lg:gap-16">
            <div>
              <h1 className="serif text-balance text-[48px] leading-[0.97] sm:text-[68px] lg:text-[80px]">
                Alquilar <em className="text-terracota-300">sin</em> sorpresas.
              </h1>
              <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-piedra-300">
                Cada anuncio mostrará el precio total, el depósito y las condiciones antes de
                contactar a nadie. La lista de espera da acceso antes del lanzamiento.
              </p>
              <ul className="mt-10 grid gap-6 border-t border-crema-100/12 pt-8 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {PROMISES.map((p) => (
                  <li key={p.title}>
                    <p className="text-[16px] font-semibold text-crema-100">{p.title}</p>
                    <p className="mt-1.5 text-[15px] leading-snug text-piedra-300">{p.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-negro">
              <WaitlistForm defaultTipo={tipo} />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <h2 className="serif text-balance text-[36px] leading-[1.02] sm:text-[48px]">
              El problema nunca fue la falta de anuncios.
            </h2>
            <div>
              <p className="text-[17px] leading-relaxed text-grafito-700">
                Precios que aparecen después. Un depósito que nadie explica. Visitas a inmuebles
                que ya estaban alquilados. Fue la falta de información completa.
              </p>
              <p className="mt-6 border-t border-piedra-250 pt-6 text-[17px] font-semibold text-negro">
                Publicar es gratis. Siempre.
              </p>
              <p className="mt-1.5 text-[16px] leading-relaxed text-grafito-700">
                Si tienes un inmueble para alquilar, la lista también es para ti: te avisamos
                cuando tu anuncio pueda salir al público.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
