import { ArrowRight, Wrench } from "lucide-react";
import type { ListingReview } from "../data/types";
import { cx } from "../lib/format";
import { Link } from "../lib/router";
import { buttonClass, Container } from "./ui";

type Issue = ListingReview["issues"][number];

/** Abre el formulario en el paso y el campo exactos donde se corrige. */
export function fixHref(listingId: string, issue?: Issue) {
  const base = `/publicar?editar=${encodeURIComponent(listingId)}`;
  return issue ? `${base}&paso=${issue.step}&campo=${encodeURIComponent(issue.field)}` : base;
}

const more = (n: number) => (n === 1 ? " y 1 cosa más" : n > 1 ? ` y ${n} cosas más` : "");

/**
 * Aviso fijo de «en revisión» con el botón «Corregir» (no un aviso que se va solo).
 * `bar`: franja pegada bajo el encabezado de la ficha. `inline`: dentro de «Mi cuenta».
 */
export function ReviewNotice({
  listingId,
  review,
  variant,
}: {
  listingId: string;
  review: ListingReview;
  variant: "bar" | "inline";
}) {
  const [first, ...rest] = review.issues;

  if (variant === "inline") {
    if (review.reported) {
      return (
        <p className="mt-1 text-[14px] text-aviso">
          <strong className="font-semibold">Lo reportó alguien.</strong> Lo revisa una persona del equipo y te avisamos
          por correo.
        </p>
      );
    }
    if (!first) {
      return (
        <p className="mt-1 text-[14px] text-aviso">
          <strong className="font-semibold">Qué corregir:</strong> {review.reason}.{" "}
          <Link to={fixHref(listingId)} className="font-semibold underline underline-offset-4">
            Corregir
          </Link>
        </p>
      );
    }
    return (
      <div className="mt-2 rounded-ctl bg-aviso-bg px-3.5 py-2.5 text-aviso">
        <p className="text-[14px] font-semibold">Corrige esto y se publica solo al guardar:</p>
        <ul className="mt-1.5 space-y-1.5">
          {review.issues.map((issue) => (
            <li key={`${issue.reason}-${issue.field}`} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[14px]">
              <span>
                {issue.reason} <span className="text-grafito-600">· en {issue.where}</span>
              </span>
              <Link
                to={fixHref(listingId, issue)}
                className="inline-flex items-center gap-1 font-semibold underline underline-offset-4"
              >
                Corregir <ArrowRight className="size-3.5" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div role="status" className="sticky top-[68px] z-[950] border-b border-aviso/20 bg-aviso-bg">
      <Container className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3 text-aviso">
        <div className="min-w-0 text-[15px] leading-snug">
          <p>
            <strong className="font-semibold">Tu anuncio está en revisión.</strong> Solo tú lo ves.
          </p>
          <p className="mt-0.5">
            {review.reported
              ? "Lo reportó alguien. Lo revisa una persona del equipo y te avisamos por correo."
              : first
                ? `${first.reason}, en ${first.where}${more(rest.length)}. Corrígelo y se publica solo al guardar.`
                : `${review.reason}. Corrígelo y se publica solo al guardar.`}
          </p>
        </div>
        {!review.reported && (
          <Link to={fixHref(listingId, first)} className={cx(buttonClass("ink", "sm"), "shrink-0")}>
            <Wrench className="size-4" /> Corregir
          </Link>
        )}
      </Container>
    </div>
  );
}
