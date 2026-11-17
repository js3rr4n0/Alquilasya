"use client";

import { ArrowRight, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, ButtonLink, Container } from "../components/ui";
import { fieldClass } from "../components/WaitlistForm";
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
};
type InquiryRow = {
  id: string;
  listing_id: string;
  listing_title: string;
  nombre: string;
  whatsapp: string;
  mensaje: string;
  created_at: string;
};

const STATUS: Record<Status, { label: string; tone: "aviso" | "exito" | "error" | "neutral"; hint: string }> = {
  pendiente: { label: "En revisión", tone: "aviso", hint: "Lo revisamos antes de mostrarlo al público." },
  publicada: { label: "Publicado", tone: "exito", hint: "Visible para quien busca." },
  pausada: { label: "Pausado", tone: "neutral", hint: "Oculto. Puedes reactivarlo cuando quieras." },
  rechazada: { label: "No publicado", tone: "error", hint: "Escríbenos para saber qué corregir." },
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

function waLink(whatsapp: string) {
  let digits = whatsapp.replace(/\D/g, "");
  if (digits.length === 8) digits = `503${digits}`;
  return `https://wa.me/${digits}`;
}

/** Panel de quien publica: estado de sus anuncios, mensajes recibidos y datos de contacto. */
export function Account() {
  const { user, authLoaded, setUser, logout } = useStore();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingRow[] | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [busy, setBusy] = useState(false);

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
    const data = (await res.json()) as { listings: ListingRow[]; inquiries: InquiryRow[] };
    setListings(data.listings);
    setInquiries(data.inquiries);
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
                  <li key={l.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
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
                      <p className="mt-0.5 text-[14px] text-grafito-600">{STATUS[l.status].hint}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ButtonLink to={`/publicar?editar=${encodeURIComponent(l.id)}`} variant="outline" size="sm">
                        Editar
                      </ButtonLink>
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
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="mensajes-recibidos">
            <h2 id="mensajes-recibidos" className="head text-[26px]">
              Contactos sin cuenta.
            </h2>
            <p className="mt-2 text-[14px] text-grafito-600">
              Personas que te escribieron desde la ficha sin registrarse. El chat con quienes sí
              tienen cuenta está en Mensajes.
            </p>
            {inquiries.length === 0 ? (
              <p className="mt-3 text-[16px] text-grafito-600">
                Aún no hay ninguno.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
                {inquiries.map((q) => (
                  <li key={q.id} className="p-5">
                    <p className="text-[14px] text-grafito-600">
                      {when(q.created_at)} · {q.listing_title}
                    </p>
                    <p className="mt-1 text-[16px] font-semibold">{q.nombre}</p>
                    <p className="mt-1 max-w-[70ch] text-[15px] leading-relaxed text-grafito-700">
                      {q.mensaje}
                    </p>
                    <a
                      href={waLink(q.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-terracota-700 underline underline-offset-4"
                    >
                      Responder por WhatsApp ({q.whatsapp}) <ArrowRight className="size-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
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
