"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button } from "../components/ui";
import { Link } from "../lib/router";

type Row = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: string;
  reason: string;
  details: string | null;
  status: "abierto" | "resuelto";
  created_at: string;
  reporter: string;
};

const REASON: Record<string, string> = {
  estafa: "Parece estafa",
  no_existe: "No existe / no disponible",
  datos_falsos: "Datos falsos",
  ofensivo: "Ofensivo o discriminatorio",
  otro: "Otro",
};
const when = (v: string) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/El_Salvador" }).format(new Date(v));

/** Pestaña «Reportes»: lo que la gente marcó, agrupado por anuncio. */
export function AdminReports({ onChange }: { onChange?: () => void }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/reportes");
    if (!res.ok) return setError("No se pudieron cargar los reportes.");
    setRows(((await res.json()) as { reports: Row[] }).reports);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of rows ?? []) map.set(r.listing_id, [...(map.get(r.listing_id) ?? []), r]);
    return [...map.values()].sort(
      (a, b) => Number(b.some((r) => r.status === "abierto")) - Number(a.some((r) => r.status === "abierto")),
    );
  }, [rows]);

  async function act(listingId: string, action: "descartar" | "retirar") {
    if (action === "retirar" && !window.confirm("¿Retirar este anuncio? Quedará como rechazado.")) return;
    setBusy(true);
    const res = await fetch("/api/admin/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, action }),
    });
    if (!res.ok) setError("No se pudo aplicar.");
    await load();
    onChange?.();
    setBusy(false);
  }

  if (error) return <p role="alert" className="mt-8 text-[15px] font-medium text-error">{error}</p>;
  if (!rows) return <div className="mt-8 h-40 animate-pulse rounded-card bg-arena-200" aria-busy="true" />;
  if (!groups.length) return <p className="mt-8 text-[16px] text-grafito-600">Nadie ha reportado anuncios todavía.</p>;

  return (
    <ul className="mt-8 space-y-4">
      {groups.map((g) => {
        const open = g.filter((r) => r.status === "abierto");
        const first = g[0];
        return (
          <li key={first.listing_id} className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {open.length ? (
                    <Badge tone="error">{open.length} abierto{open.length === 1 ? "" : "s"}</Badge>
                  ) : (
                    <Badge tone="neutral">Resuelto</Badge>
                  )}
                  <Badge tone={first.listing_status === "publicada" ? "exito" : "aviso"}>{first.listing_status}</Badge>
                  <Link to={`/casa/${first.listing_id}`} className="text-[16px] font-semibold underline-offset-4 hover:underline">
                    {first.listing_title}
                  </Link>
                </div>
              </div>
              {open.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => act(first.listing_id, "descartar")}>
                    Descartar (está bien)
                  </Button>
                  <Button variant="primary" size="sm" disabled={busy} onClick={() => act(first.listing_id, "retirar")}>
                    Retirar anuncio
                  </Button>
                </div>
              )}
            </div>
            <ul className="mt-3 divide-y divide-arena-200 border-t border-arena-200">
              {g.map((r) => (
                <li key={r.id} className="py-2.5 text-[14px]">
                  <span className="font-medium text-negro">{REASON[r.reason] ?? r.reason}</span>
                  <span className="text-grafito-600"> · {r.reporter} · {when(r.created_at)}</span>
                  {r.status === "resuelto" && <span className="text-grafito-600"> · resuelto</span>}
                  {r.details && <p className="mt-1 text-grafito-700">«{r.details}»</p>}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}
