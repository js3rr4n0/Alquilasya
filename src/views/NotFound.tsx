"use client";

import { Simbolo } from "../brand/Logo";
import { ButtonLink, Container } from "../components/ui";

export function NotFound() {
  return (
    <Container className="py-24 text-center">
      <Simbolo height={64} tone="dos-tintas" className="mx-auto" />
      <p className="label mt-6 text-terracota-700">404 · Página no encontrada</p>
      <h1 className="serif mt-3 text-[44px] leading-none sm:text-[56px]">
        Aquí no hay ninguna puerta.
      </h1>
      <p className="mx-auto mt-4 max-w-[44ch] text-[15.5px] text-grafito-700">
        La dirección a la que entraste no existe o cambió de lugar.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink to="/" variant="ink">
          Ir al inicio
        </ButtonLink>
        <ButtonLink to="/explorar" variant="outline">
          Explorar casas
        </ButtonLink>
      </div>
    </Container>
  );
}
