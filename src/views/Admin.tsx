"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Container } from "../components/ui";
import { fieldClass } from "../components/WaitlistForm";
import { Link } from "../lib/router";

type ListingRow = {
  id: string;
  status: "pendiente" | "publicada" | "rechazada" | "pausada";
  title: string;
  type: string;
  zone: string;
  price_month: string | null;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string | null;
  plan: string;
  created_at: string;
};
type InquiryRow = {
  id: string;
  listing_id: string;
  listing_title: string;
  is_example: boolean;
  nombre: string;
  whatsapp: string;
  mensaje: string;
  created_at: string;
};
type Overview = {
  listings: ListingRow[];
  inquiries: InquiryRow[];
  waitlist: { total: number; propietarios: number; inquilinos: number };
};

const KEY = "alquilasya.admin";
const TONE = { pendiente: "aviso", publicada: "exito", rechazada: "error", pausada: "neutral" } as const;
const when = (iso: string) =>
  new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

/** Moderación: aprobar anuncios y leer mensajes. Se entra con ADMIN_TOKEN. */
export function Admin() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (t: string) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin", { headers: { "x-admin-token": t } });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "No se pudo entrar.");
      setData(body as Overview);
      setToken(t);
      sessionStorage.setItem(KEY, t);
    } catch (e) {
      setData(null);
      setToken("");
      sessionStorage.removeItem(KEY);
      setError(e instanceof Error ? e.message : "No se pudo entrar.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) load(saved);
  }, [load]);

  async function setStatus(id: string, status: ListingRow["status"]) {
    setBusy(true);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) setError("No se pudo actualizar el anuncio.");
    await load(token);
  }

  if (!data) {
    return (
      <Container className="py-20">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(input.trim());
          }}
          className="mx-auto max-w-md rounded-card bg-crema-050 p-7 ring-1 ring-piedra-250"
        >
          <p className="label text-terracota-700">Moderación</p>
          <h1 className="head mt-2 text-[28px]">Entrar.</h1>
          <label className="mt-5 block">
            <span className="text-[14px] font-medium text-grafito-700">Clave de administración</span>
            <input
              type="password"
              autoComplete="current-password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={fieldClass}
            />
          </label>
          {error && (
            <p role="alert" className="mt-3 text-[15px] font-medium text-error">
              {error}
            </p>
          )}
          <Button type="submit" variant="ink" size="lg" className="mt-5 w-full" disabled={busy || !input}>
            Entrar
          </Button>
          <p className="mt-4 text-[14px] leading-snug text-grafito-600">
            La clave es la variable de entorno ADMIN_TOKEN del proyecto.
          </p>
        </form>
      </Container>
    );
  }

  const pending = data.listings.filter((l) => l.status === "pendiente").length;

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-terracota-700">Moderación</p>
          <h1 className="head mt-2 text-[34px]">Anuncios y mensajes.</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load(token)} disabled={busy}>
            Actualizar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem(KEY);
              setData(null);
              setToken("");
            }}
          >
            Salir
          </Button>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["Por revisar", pending],
          ["Anuncios", data.listings.length],
          ["Mensajes", data.inquiries.length],
          ["Lista de espera", data.waitlist.total],
        ].map(([label, value]) => (
          <div key={label} className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
            <dt className="text-[14px] text-grafito-600">{label}</dt>
            <dd className="mt-1 text-[32px] font-semibold tabular-nums tracking-[-0.03em]">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[14px] text-grafito-600">
        Lista de espera: {data.waitlist.inquilinos} buscan · {data.waitlist.propietarios} publican.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-[15px] font-medium text-error">
          {error}
        </p>
      )}

      <h2 className="head mt-12 text-[24px]">Anuncios.</h2>
      {data.listings.length === 0 ? (
        <p className="mt-3 text-[16px] text-grafito-600">Todavía no hay anuncios enviados.</p>
      ) : (
        <ul className="mt-4 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
          {data.listings.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TONE[l.status]}>{l.status}</Badge>
                  <span className="text-[16px] font-semibold">{l.title}</span>
                </div>
                <p className="mt-1 text-[14px] text-grafito-600">
                  {l.type} · {l.zone}
                  {l.price_month ? ` · $${Number(l.price_month)} / mes` : ""} · {when(l.created_at)}
                </p>
                <p className="mt-1 text-[14px] text-grafito-700">
                  {l.contact_name} · {l.contact_whatsapp}
                  {l.contact_email ? ` · ${l.contact_email}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {l.status === "publicada" && (
                  <Link to={`/casa/${l.id}`} className="self-center text-[14px] font-medium underline underline-offset-4">
                    Ver ficha
                  </Link>
                )}
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
      )}

      <h2 className="head mt-12 text-[24px]">Mensajes recibidos.</h2>
      {data.inquiries.length === 0 ? (
        <p className="mt-3 text-[16px] text-grafito-600">Todavía no hay mensajes.</p>
      ) : (
        <ul className="mt-4 divide-y divide-arena-200 rounded-card bg-crema-050 ring-1 ring-arena-200">
          {data.inquiries.map((q) => (
            <li key={q.id} className="p-5">
              <p className="text-[14px] text-grafito-600">
                {when(q.created_at)} · {q.listing_title}
                {q.is_example ? " · anuncio de ejemplo" : ""}
              </p>
              <p className="mt-1 text-[16px] font-semibold">
                {q.nombre} · <span className="tabular-nums">{q.whatsapp}</span>
              </p>
              <p className="mt-1 max-w-[80ch] text-[15px] leading-relaxed text-grafito-700">{q.mensaje}</p>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
