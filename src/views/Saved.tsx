"use client";

import { ArrowRight, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { ListingCard } from "../components/ListingCard";
import { ButtonLink, Container } from "../components/ui";
import type { ListingSummary } from "../data/types";
import { useStore } from "../lib/store";
import { Link } from "../lib/router";

/** «Guardadas»: los anuncios que la persona marcó con el corazón. */
export function Saved() {
  const { favorites, duration, user, authLoaded } = useStore();
  const [results, setResults] = useState<ListingSummary[] | null>(null);
  const key = favorites.join(",");

  useEffect(() => {
    if (!key) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const ids = key.split(",").slice(0, 200);
    // De a 24 por página del buscador: se piden todas las páginas necesarias.
    const pages = Math.ceil(ids.length / 24);
    Promise.all(
      Array.from({ length: pages }, (_, i) =>
        fetch(`/api/listings?plazo=${duration}&ids=${encodeURIComponent(ids.join(","))}&pagina=${i + 1}`, {
          signal: ctrl.signal,
        }).then((r) => r.json() as Promise<{ results: ListingSummary[] }>),
      ),
    )
      .then((all) => {
        const found = all.flatMap((d) => d.results ?? []);
        // En el orden en que se guardaron (lo último primero).
        found.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
        setResults(found);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [key, duration]);

  const missing = results ? favorites.length - results.length : 0;

  return (
    <Container className="py-12 lg:py-16">
      <p className="label text-terracota-700">Tu lista</p>
      <h1 className="serif mt-3 text-[44px] leading-[0.98] sm:text-[56px]">Guardadas.</h1>
      <p className="mt-4 max-w-[60ch] text-[17px] leading-relaxed text-grafito-700">
        Los alquileres que marcaste con <Heart className="inline size-4 -translate-y-px" aria-label="corazón" /> para
        compararlos con calma.
        {authLoaded && !user && (
          <>
            {" "}
            <Link to="/entrar?next=/guardadas" className="font-semibold underline underline-offset-4">
              Entra con tu cuenta
            </Link>{" "}
            para tenerlas también en tu teléfono o en otra computadora.
          </>
        )}
      </p>

      {results === null ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-[4/5] animate-pulse rounded-card bg-arena-200" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="mt-10 rounded-card bg-crema-050 p-8 ring-1 ring-arena-200">
          <p className="text-[18px] font-semibold text-negro">Todavía no guardas ningún alquiler.</p>
          <p className="mt-2 text-[16px] text-grafito-700">
            En cada anuncio toca el corazón para guardarlo aquí.
          </p>
          <ButtonLink to="/explorar" variant="primary" className="mt-5">
            Explorar alquileres <ArrowRight className="size-4" />
          </ButtonLink>
        </div>
      ) : (
        <>
          <p className="mt-8 text-[15px] text-grafito-600">
            {results.length} {results.length === 1 ? "alquiler guardado" : "alquileres guardados"}
            {missing > 0 && ` · ${missing} ya no ${missing === 1 ? "está disponible" : "están disponibles"}`}
          </p>
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((l) => (
              <ListingCard key={l.id} listing={l} duration={duration} />
            ))}
          </div>
        </>
      )}
    </Container>
  );
}
