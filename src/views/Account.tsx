"use client";

import { ArrowRight, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, ButtonLink, Container } from "../components/ui";
import { fieldClass } from "../components/WaitlistForm";
import { PLANS, usd, type PlanId } from "../lib/plans";
import { Link, useNavigate } from "../lib/router";
import { useStore, type Account as User } from "../lib/store";

type Status = "pendiente" | "publicada" | "rechazada" | "pausada";
type ListingRow = {
  id: string;
  status: Status;
  title: string;
  type: string;
  zone: string;
  region: string;
  price_month: string | null;
  created_at: string;
  featured_until: string | null;
  review_reason: string | null;
};
type PaymentRow = { id: string; listing_title: string; plan: PlanId; amount: string; paid_at: string | null };

const dateEs = (v: string) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: "America/El_Salvador" }).format(new Date(v));
const featured = (l: ListingRow) => Boolean(l.featured_until && new Date(l.featured_until) > new Date());

const STATUS: Record<Status, { label: string; tone: "aviso" | "exito" | "error" | "neutral"; hint: string }> = {
  pendiente: { label: "En revisión", tone: "aviso", hint: "Lo revisamos antes de mostrarlo al público." },
  // El motivo concreto (review_reason) se muestra debajo cuando el filtro marcó algo.
  publicada: { label: "Publicado", tone: "exito", hint: "Visible para quien busca." },
  pausada: { label: "Pausado", tone: "neutral", hint: "Oculto. Al reactivarlo vuelve a salir al instante." },
  rechazada: { label: "No publicado", tone: "error", hint: "Escríbenos para saber qué corregir." },
};



/** Panel de quien publica: estado de sus anuncios, mensajes recibidos y datos de contacto. */
export function Account() {
  const { user, authLoaded, setUser, logout } = useStore();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingRow[] | null>(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [featuring, setFeaturing] = useState<string | null>(null);
  const [paying, setPaying] = useState<PlanId | null>(null);

  useEffect(() => {
    if (authLoaded && !user) navigate("/entrar?next=/cuenta", { replace: true });
  }, [authLoaded, user, navigate]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setWhatsapp(user.whatsapp ?? "");
    }
  }, [user]);

  const load = useCallback(async () => {
    const res = await fetch("/api/account");
    if (!res.ok) return;
    const data = (await res.json()) as { listings: ListingRow[]; payments?: PaymentRow[] };
    setListings(data.listings);
    setPayments(data.payments ?? []);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function act(id: string, action: "pausar" | "reactivar" | "borrar") {
    if (action === "borrar" && !window.confirm("¿Borrar este anuncio? No se puede deshacer.")) return;
    setBusy(true);
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    if (!res.ok) toast.error("No se pudo aplicar el cambio.");
    await load();
    setBusy(false);
  }

  async function pay(listingId: string, plan: PlanId) {
    setPaying(plan);
    const res = await fetch("/api/pagos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, plan }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (res.ok && data.url) {
      window.location.assign(data.url);
      return;
    }
    toast.error(data.error ?? "No pudimos abrir la página de pago.");
    setPaying(null);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), whatsapp: whatsapp.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as { user?: User; error?: string };
    if (res.ok && data.user) {
      setUser(data.user);
      toast.success("Datos guardados.");
    } else toast.error(data.error ?? "No se pudieron guardar tus datos.");
    setBusy(false);
  }

  if (!user) return <div className="min-h-[60vh]" aria-busy="true" />;

  return (
    <Container className="py-12 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-terracota-700">Mi cuenta</p>
          <h1 className="serif mt-3 text-[44px] leading-[0.98] sm:text-[56px]">
            Hola, {user.name.split(" ")[0]}.
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.admin && (
            <ButtonLink to="/admin" variant="outline">
              Admin
            </ButtonLink>
          )}
          <ButtonLink to="/mensajes" variant="outline">
            Mensajes
          </ButtonLink>
          <ButtonLink to="/publicar" variant="primary">
            <Plus className="size-4" /> Publicar una propiedad
          </ButtonLink>
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              // Recarga completa: no queda nada de la sesión en memoria.
              window.location.assign("/");
            }}
          >
            Salir
          </Button>
        </div>
      </div>

      {!user.verified && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-card bg-aviso-bg px-5 py-4 text-aviso">
          <p className="text-[15px]">
            <strong className="font-semibold">Falta confirmar tu correo.</strong> Hasta entonces no
            puedes publicar ni chatear.
          </p>
          <ButtonLink to="/verificar?next=/cuenta" variant="ink" size="sm">
            Confirmar ahora
          </ButtonLink>
        </div>
      )}

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-12">
          <section aria-labelledby="mis-anuncios">
            <h2 id="mis-anuncios" className="head text-[26px]">
              Mis anuncios.
            </h2>
            {listings === null ? (
              <div className="mt-4 h-28 animate-pulse rounded-card bg-arena-200" />
            ) : listings.length === 0 ? (
              <div className="mt-4 rounded-card bg-crema-050 p-7 ring-1 ring-arena-200">
                <p className="text-[16px] text-grafito-700">Todavía no has publicado nada.</p>
                <Link
                  to="/publicar"
                  className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4"
                >
                  Publicar gratis <ArrowRight className="size-4" />
                </Link>
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
                {listings.map((l) => (
                  <li key={l.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
                        {featured(l) && <Badge tone="neutral">Destacado hasta el {dateEs(l.featured_until!)}</Badge>}
                        <Link
                          to={`/casa/${l.id}`}
                          className="text-[17px] font-semibold underline-offset-4 hover:underline"
                        >
                          {l.title}
                        </Link>
                      </div>
                      <p className="mt-1 text-[14px] text-grafito-600">
                        {l.type} · {l.zone}, {l.region}
                        {l.price_month ? ` · $${Number(l.price_month)} / mes` : ""}
                      </p>
                      {l.status === "pendiente" && l.review_reason ? (
                        <p className="mt-0.5 text-[14px] text-aviso">
                          <strong className="font-semibold">Qué corregir:</strong> {l.review_reason}. Usa «Editar» y se
                          publica solo al guardar.
                        </p>
                      ) : (
                        <p className="mt-0.5 text-[14px] text-grafito-600">{STATUS[l.status].hint}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink to={`/publicar?editar=${encodeURIComponent(l.id)}`} variant="outline" size="sm">
                        Editar
                      </ButtonLink>
                      {(l.status === "publicada" || (l.status === "pendiente" && !l.review_reason)) && (
                        <Button
                          variant={featuring === l.id ? "ink" : "primary"}
                          size="sm"
                          aria-expanded={featuring === l.id}
                          onClick={() => setFeaturing(featuring === l.id ? null : l.id)}
                        >
                          {featured(l) ? "Extender destacado" : l.status === "pendiente" ? "Destacar y publicar ya" : "Destacar"}
                        </Button>
                      )}
                      {l.status === "publicada" && (
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => act(l.id, "pausar")}>
                          Pausar
                        </Button>
                      )}
                      {l.status === "pausada" && (
                        <Button variant="outline" size="sm" disabled={busy} onClick={() => act(l.id, "reactivar")}>
                          Reactivar
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" disabled={busy} onClick={() => act(l.id, "borrar")}>
                        Borrar
                      </Button>
                    </div>
                  </div>
                  {featuring === l.id && (l.status === "publicada" || (l.status === "pendiente" && !l.review_reason)) && (
                    <div className="mt-4 rounded-ctl bg-crema-100 p-4 ring-1 ring-arena-200">
                      <p className="text-[15px] text-grafito-700">
                        Tu anuncio aparece <strong className="font-semibold text-negro">primero en las búsquedas</strong> de
                        su zona, con la etiqueta «Anuncio». Publicar sigue siendo gratis; esto es opcional.
                        {featured(l) && " Los días se suman a los que ya tienes."}
                        {l.status === "pendiente" && " Al pagar, tu anuncio se publica de inmediato, sin esperar la revisión."}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {PLANS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            disabled={paying !== null}
                            onClick={() => pay(l.id, p.id)}
                            className="rounded-ctl bg-crema-050 p-4 text-left ring-1 ring-piedra-250 transition hover:ring-negro disabled:opacity-60"
                          >
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="text-[16px] font-semibold text-negro">{p.name}</span>
                              <span className="text-[20px] font-semibold text-negro">{usd(p.price)}</span>
                            </span>
                            <span className="mt-1 block text-[14px] text-grafito-600">
                              {paying === p.id ? "Abriendo Wompi…" : p.blurb}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-[13px] text-grafito-600">
                        Pagas con tarjeta en la página segura de Wompi (Banco Agrícola). Un solo pago, sin
                        renovación automática. El destacado se activa apenas Wompi confirma el cobro.
                      </p>
                    </div>
                  )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {payments.length > 0 && (
            <section aria-labelledby="mis-pagos">
              <h2 id="mis-pagos" className="head text-[24px]">
                Mis pagos.
              </h2>
              <ul className="mt-4 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-3 px-5 py-3.5 text-[15px]">
                    <span className="min-w-0">
                      <span className="font-medium text-negro">{PLANS.find((x) => x.id === p.plan)?.name ?? p.plan}</span>
                      <span className="text-grafito-600"> · {p.listing_title}</span>
                    </span>
                    <span className="text-grafito-700">
                      {usd(Number(p.amount))} · {p.paid_at ? dateEs(p.paid_at) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="mensajes-recibidos" className="rounded-card bg-crema-050 p-6 ring-1 ring-arena-200">
            <h2 id="mensajes-recibidos" className="head text-[24px]">
              Mensajes.
            </h2>
            <p className="mt-2 text-[16px] leading-relaxed text-grafito-700">
              Quien se interesa por tu anuncio te escribe desde su cuenta, por el chat privado. Ahí
              respondes; tu número no se muestra a nadie.
            </p>
            <ButtonLink to="/mensajes" variant="ink" className="mt-4">
              Abrir Mensajes <ArrowRight className="size-4" />
            </ButtonLink>
          </section>
        </div>

        <form
          onSubmit={saveProfile}
          className="space-y-5 rounded-card bg-crema-050 p-6 ring-1 ring-piedra-250 lg:sticky lg:top-[88px]"
        >
          <h2 className="head text-[22px]">Mis datos.</h2>
          <p className="text-[14px] text-grafito-600">{user.email}</p>
          <label className="block">
            <span className="text-[14px] font-medium text-grafito-700">Nombre</span>
            <input value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </label>
          <label className="block">
            <span className="text-[14px] font-medium text-grafito-700">WhatsApp</span>
            <input
              type="tel"
              placeholder="+503 7000 0000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className={fieldClass}
            />
          </label>
          <Button type="submit" variant="ink" className="w-full" disabled={busy}>
            Guardar
          </Button>
        </form>
      </div>
    </Container>
  );
}
