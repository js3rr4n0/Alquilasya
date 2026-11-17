"use client";

import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ButtonLink, Container } from "../components/ui";
import { planById, usd } from "../lib/plans";
import { useNavigate, useSearchParams } from "../lib/router";
import { useStore } from "../lib/store";

type Order = {
  id: string;
  status: "pendiente" | "pagada" | "fallida" | "vencida";
  plan: string;
  days: number;
  amount: number;
  listingId: string | null;
  listingTitle: string;
  featuredUntil: string | null;
};

const ATTEMPTS = 8;

/**
 * Página a la que Wompi devuelve después de pagar. No activa nada por sí misma:
 * pide al servidor que consulte a Wompi y muestra lo que este responde.
 */
export function PaymentResult() {
  const { user, authLoaded } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const id = params.get("orden") ?? params.get("identificadorEnlaceComercio") ?? "";
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (authLoaded && !user) navigate(`/entrar?next=${encodeURIComponent(`/pago?orden=${id}`)}`, { replace: true });
  }, [authLoaded, user, navigate, id]);

  useEffect(() => {
    if (!user || !id) return;
    if (order && order.status !== "pendiente") return;
    if (tries >= ATTEMPTS) return;
    const t = window.setTimeout(
      async () => {
        const res = await fetch("/api/pagos/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = (await res.json().catch(() => ({}))) as { order?: Order; error?: string };
        if (data.order) setOrder(data.order);
        else setError(data.error ?? "No pudimos revisar el pago.");
        setTries((n) => n + 1);
      },
      tries === 0 ? 0 : 3000,
    );
    return () => window.clearTimeout(t);
  }, [user, id, order, tries]);

  // Pago confirmado: a los pocos segundos se lleva a la persona a su cuenta.
  const paid = order?.status === "pagada";
  useEffect(() => {
    if (!paid) return;
    const t = window.setTimeout(() => navigate("/cuenta?pago=ok", { replace: true }), 5000);
    return () => window.clearTimeout(t);
  }, [paid, navigate]);

  const plan = order ? planById(order.plan) : null;
  const until = order?.featuredUntil
    ? new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "America/El_Salvador" }).format(
        new Date(order.featuredUntil),
      )
    : null;

  let heading = "Revisando tu pago…";
  let body = "Estamos confirmando con Wompi. Tarda unos segundos.";
  if (!id || error) {
    heading = "No encontramos ese pago.";
    body = error || "El enlace está incompleto. Revisa tu cuenta o escríbenos a contacto@alquilasya.com.";
  } else if (order?.status === "pagada") {
    heading = "Listo, tu anuncio está destacado.";
    body = `${plan?.name ?? "Destacado"} por ${usd(order.amount)}. «${order.listingTitle}» aparece primero en las búsquedas${until ? ` hasta el ${until}` : ""}. Wompi te envió el comprobante por correo.`;
  } else if (order?.status === "vencida" || order?.status === "fallida") {
    heading = "Ese pago no se completó.";
    body = "No se hizo ningún cobro con este enlace. Puedes intentarlo de nuevo desde tu cuenta.";
  } else if (order && tries >= ATTEMPTS) {
    heading = "Aún no vemos el pago.";
    body =
      "Si completaste el pago, Wompi nos avisará en unos minutos y el destacado se activará solo. Si el banco lo rechazó, no se hizo ningún cobro y puedes intentarlo otra vez desde tu cuenta.";
  }

  return (
    <Container className="py-16 lg:py-24">
      <div className="mx-auto max-w-[560px] rounded-card bg-crema-050 p-8 ring-1 ring-arena-200" aria-live="polite">
        <p className="label text-terracota-700">Pago</p>
        <h1 className="head mt-3 text-[32px] leading-tight">{heading}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-grafito-700">{body}</p>
        {paid && <p className="mt-3 text-[14px] text-grafito-600">Te llevamos a tu cuenta en unos segundos…</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          {order?.status === "pagada" && order.listingId && (
            <ButtonLink to={`/casa/${order.listingId}`} variant="ink">
              Ver mi anuncio <ArrowRight className="size-4" />
            </ButtonLink>
          )}
          <ButtonLink to="/cuenta" variant="outline">
            Ir a mi cuenta
          </ButtonLink>
        </div>
      </div>
    </Container>
  );
}
