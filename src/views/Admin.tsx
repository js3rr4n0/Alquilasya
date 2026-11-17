"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Container, Segmented } from "../components/ui";
import { Link } from "../lib/router";
import { useStore } from "../lib/store";
import { NotFound } from "./NotFound";

type Status = "pendiente" | "publicada" | "rechazada" | "pausada";
type ListingRow = {
  id: string;
  status: Status;
  title: string;
  type: string;
  zone: string;
  region: string;
  price_month: string | null;
  contact_name: string;
  contact_whatsapp: string;
  owner_email: string | null;
  edited_at: string | null;
  created_at: string;
};
type InquiryRow = {
  id: string;
  listing_title: string;
  is_example: boolean;
  nombre: string;
  whatsapp: string;
  mensaje: string;
  created_at: string;
};
type UserRow = {
  id: string;
  email: string;
  name: string;
  whatsapp: string | null;
  verified: boolean;
  listings: number;
  created_at: string;
};
type Overview = {
  listings: ListingRow[];
  inquiries: InquiryRow[];
  users: UserRow[];
  totals: Record<string, number>;
  services: { correo: boolean; fotos: boolean };
};
type Tab = "resumen" | "anuncios" | "usuarios" | "mensajes";

const TONE = { pendiente: "aviso", publicada: "exito", rechazada: "error", pausada: "neutral" } as const;
const when = (iso: string) =>
  new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

/**
 * Sala de administración. Solo responde a cuentas verificadas cuyo correo está
 * en ADMIN_EMAILS; para cualquier otra persona esta página no existe.
 */
export function Admin() {
  const { user, authLoaded } = useStore();
  const [data, setData] = useState<Overview | null>(null);
  const [tab, setTab] = useState<Tab>("resumen");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin");
    if (res.ok) setData((await res.json()) as Overview);
    else setError("No se pudo cargar el panel.");
  }, []);

  useEffect(() => {
    if (user?.admin) load();
  }, [user, load]);

  async function setStatus(id: string, status: Status) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) setError("No se pudo actualizar el anuncio.");
    await load();
    setBusy(false);
  }

  if (!authLoaded) return <div className="min-h-[60vh]" aria-busy="true" />;
  if (!user?.admin) return <NotFound />;
  if (!data) return <Container className="py-16">{error || "Cargando…"}</Container>;

  const t = data.totals;
  const pending = data.listings.filter((l) => l.status === "pendiente");

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-terracota-700">Administración</p>
          <h1 className="head mt-2 text-[34px]">Sala de control.</h1>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={busy}>
          Actualizar
        </Button>
      </div>

      <Segmented
        label="Sección"
        className="mt-8"
        value={tab}
        onChange={setTab}
        options={[
          { value: "resumen", label: "Resumen" },
          { value: "anuncios", label: `Anuncios${pending.length ? ` (${pending.length})` : ""}` },
          { value: "usuarios", label: "Usuarios" },
          { value: "mensajes", label: "Contactos" },
        ]}
      />
      {error && (
        <p role="alert" className="mt-4 text-[15px] font-medium text-error">
          {error}
        </p>
      )}

      {tab === "resumen" && (
        <>
          <dl className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Por revisar", t.listings_pending, `${t.listings_published} publicados de ${t.listings}`],
              ["Usuarios", t.users, `${t.users_verified} verificados · +${t.users_week} esta semana`],
              ["Mensajes de chat", t.messages, `${t.conversations} conversaciones · +${t.messages_week} esta semana`],
              ["Contactos por ficha", t.inquiries, `+${t.inquiries_week} esta semana`],
              ["Anuncios nuevos", t.listings_week, "en los últimos 7 días"],
              ["Lista de espera", t.waitlist, `${t.waitlist_owners} propietarios`],
            ].map(([label, value, hint]) => (
              <div key={label} className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
                <dt className="text-[14px] text-grafito-600">{label}</dt>
                <dd className="mt-1 text-[34px] font-semibold tabular-nums leading-none tracking-[-0.03em]">
                  {value}
                </dd>
                <dd className="mt-2 text-[14px] text-grafito-600">{hint}</dd>
              </div>
            ))}
          </dl>

          <h2 className="head mt-12 text-[22px]">Servicios.</h2>
          <ul className="mt-4 divide-y divide-arena-200 rounded-card bg-crema-050 text-[15px] ring-1 ring-arena-200">
            {[
              ["Base de datos", true, "Conectada"],
              ["Correo (códigos y avisos)", data.services.correo, data.services.correo ? "Configurado" : "Falta RESEND_API_KEY o MAIL_FROM: nadie puede verificar su cuenta"],
              ["Fotos propias (Vercel Blob)", data.services.fotos, data.services.fotos ? "Conectado" : "Sin conectar: solo fotos de muestra"],
            ].map(([name, ok, note]) => (
              <li key={name as string} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <span className="font-medium">{name}</span>
                <Badge tone={ok ? "exito" : "aviso"}>{note}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[14px] leading-relaxed text-grafito-600">
            Visitas y velocidad: pestañas Analytics y Speed Insights del proyecto en Vercel. Errores
            del servidor: pestaña Logs. Los chats privados se cuentan aquí, pero no se muestran.
          </p>
        </>
      )}

      {tab === "anuncios" &&
        (data.listings.length === 0 ? (
          <p className="mt-8 text-[16px] text-grafito-600">Todavía no hay anuncios enviados.</p>
        ) : (
          <ul className="mt-8 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
            {data.listings.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TONE[l.status]}>{l.status}</Badge>
                    {l.edited_at && <Badge tone="info">Editado {when(l.edited_at)}</Badge>}
                    <span className="text-[16px] font-semibold">{l.title}</span>
                  </div>
                  <p className="mt-1 text-[14px] text-grafito-600">
                    {l.type} · {l.zone}, {l.region}
                    {l.price_month ? ` · $${Number(l.price_month)} / mes` : ""} · {when(l.created_at)}
                  </p>
                  <p className="mt-1 text-[14px] text-grafito-700">
                    {l.contact_name} · {l.contact_whatsapp}
                    {l.owner_email ? ` · ${l.owner_email}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/publicar?editar=${encodeURIComponent(l.id)}`}
                    className="text-[14px] font-medium underline underline-offset-4"
                  >
                    Editar
                  </Link>
                  <Link to={`/casa/${l.id}`} className="text-[14px] font-medium underline underline-offset-4">
                    Ver ficha
                  </Link>
                  {l.status !== "publicada" && (
                    <Button variant="primary" size="sm" disabled={busy} onClick={() => setStatus(l.id, "publicada")}>
                      Publicar
                    </Button>
                  )}
                  {l.status === "publicada" && (
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setStatus(l.id, "pausada")}>
                      Pausar
                    </Button>
                  )}
                  {l.status !== "rechazada" && (
                    <Button variant="ghost" size="sm" disabled={busy} onClick={() => setStatus(l.id, "rechazada")}>
                      Rechazar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === "usuarios" && (
        <ul className="mt-8 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
          {data.users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="text-[16px] font-semibold">{u.name}</p>
                <p className="text-[14px] text-grafito-700">
                  {u.email}
                  {u.whatsapp ? ` · ${u.whatsapp}` : ""}
                </p>
                <p className="text-[14px] text-grafito-600">
                  Desde {when(u.created_at)} · {u.listings} {u.listings === 1 ? "anuncio" : "anuncios"}
                </p>
              </div>
              <Badge tone={u.verified ? "exito" : "aviso"}>
                {u.verified ? "Correo verificado" : "Sin verificar"}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {tab === "mensajes" &&
        (data.inquiries.length === 0 ? (
          <p className="mt-8 text-[16px] text-grafito-600">
            Aún no hay contactos enviados desde las fichas sin cuenta.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
            {data.inquiries.map((q) => (
              <li key={q.id} className="p-5">
                <p className="text-[14px] text-grafito-600">
                  {when(q.created_at)} · {q.listing_title}
                  {q.is_example ? " · casa de ejemplo" : ""}
                </p>
                <p className="mt-1 text-[16px] font-semibold">
                  {q.nombre} · <span className="tabular-nums">{q.whatsapp}</span>
                </p>
                <p className="mt-1 max-w-[80ch] text-[15px] leading-relaxed text-grafito-700">{q.mensaje}</p>
              </li>
            ))}
          </ul>
        ))}
    </Container>
  );
}
