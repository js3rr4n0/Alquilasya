import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui";
import { GUIDES } from "@/data/guides";

export const metadata: Metadata = {
  title: "Guías para alquilar en El Salvador",
  description:
    "Guías prácticas para alquilar y para publicar en El Salvador: qué preguntar, el depósito, mascotas, alquilar desde el extranjero y cómo evitar estafas.",
  alternates: { canonical: "/guias" },
};

export default function Page() {
  return (
    <div>
      <section className="on-dark dots bg-negro pb-12 pt-10 text-crema-100">
        <Container>
          <p className="label text-terracota-300">Guías</p>
          <h1 className="serif mt-4 max-w-[16ch] text-balance text-[48px] leading-[0.98] sm:text-[68px]">
            Alquilar <em className="text-terracota-300">sabiendo</em> qué preguntar.
          </h1>
          <p className="mt-5 max-w-[58ch] text-[17px] leading-relaxed text-piedra-300">
            Respuestas cortas a las dudas más frecuentes de quien busca y de quien publica un
            alquiler en El Salvador.
          </p>
        </Container>
      </section>
      <Container className="py-12 lg:py-16">
        <ul className="grid gap-6 md:grid-cols-2">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guias/${g.slug}`}
                className="flex h-full flex-col rounded-card bg-crema-050 p-6 ring-1 ring-arena-200 transition-shadow hover:ring-negro sm:p-8"
              >
                <h2 className="head text-balance text-[24px] leading-tight">{g.title}</h2>
                <p className="mt-3 flex-1 text-[16px] leading-relaxed text-grafito-700">{g.answer}</p>
                <span className="mt-5 text-[15px] font-semibold text-terracota-700 underline underline-offset-4">
                  Leer la guía
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
