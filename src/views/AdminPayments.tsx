"use client";

import { useEffect, useState } from "react";
import { Badge } from "../components/ui";
import { planById, usd } from "../lib/plans";
import { Link } from "../lib/router";

type Row = {
  id: string;
  listing_id: string | null;
  listing_title: string;
  user_email: string;
  plan: string;
  amount: string;
  status: "pendiente" | "pagada" | "fallida" | "vencida";
  live: boolean | null;
  created_at: string;
  paid_at: string | null;
};
type Data = { payments: Row[]; totals: { paid: number; revenue: string; month: string; featured: number }; enabled: boolean };

const TONE = { pagada: "exito", pendiente: "aviso", fallida: "error", vencida: "neutral" } as const;
const LABEL = { pagada: "Pagada", pendiente: "Sin pagar", fallida: "Falló", vencida: "Vencida" };
const when = (v: string) =>
  new Intl.DateTimeFormat("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/El_Salvador" }).format(new Date(v));

/** Pestaña «Pagos» de la sala de admin: destacados cobrados con Wompi. */
export function AdminPayments() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  // Los enlaces sin pagar son normales (se preparan al abrir «Destacar»): ocultos por defecto.
  const [showOpen, setShowOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pagos")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("No se pudieron cargar los pagos."));
  }, []);

  if (error) return <p role="alert" className="mt-8 text-[15px] font-medium text-error">{error}</p>;
  if (!data) return <div className="mt-8 h-40 animate-pulse rounded-card bg-arena-200" aria-busy="true" />;

  return (
    <div className="mt-8 space-y-6">
      {!data.enabled && (
        <p className="rounded-card bg-aviso-bg px-5 py-4 text-[15px] text-aviso">
          Wompi no está configurado: faltan <code>WOMPI_APP_ID</code> y <code>WOMPI_API_SECRET</code> en Vercel.
        </p>
      )}
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Cobrado este mes", usd(Number(data.totals.month))],
          ["Cobrado en total", usd(Number(data.totals.revenue))],
          ["Pagos reales", String(data.totals.paid)],
          ["Destacados activos", String(data.totals.featured)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
            <dt className="text-[14px] text-grafito-600">{k}</dt>
            <dd className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.03em] text-negro">{v}</dd>
          </div>
        ))}
      </dl>
      <label className="flex items-center gap-2 text-[14px] text-grafito-700">
        <input type="checkbox" checked={showOpen} onChange={(e) => setShowOpen(e.target.checked)} className="size-4 accent-terracota-600" />
        Mostrar también los enlaces sin pagar
      </label>
      {data.payments.filter((p) => showOpen || p.status !== "pendiente").length === 0 ? (
        <p className="text-[16px] text-grafito-600">Nadie ha pagado un destacado todavía.</p>
      ) : (
        <div className="overflow-x-auto rounded-card bg-crema-050 ring-1 ring-arena-200">
          <table className="w-full min-w-[760px] text-left text-[14px]">
            <thead className="text-grafito-600">
              <tr>
                {["Fecha", "Estado", "Plan", "Monto", "Anuncio", "Cuenta"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-200">
              {data.payments.filter((p) => showOpen || p.status !== "pendiente").map((p) => (
                <tr key={p.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 tabular-nums text-grafito-700">{when(p.paid_at ?? p.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TONE[p.status]}>{LABEL[p.status]}</Badge>
                    {p.status === "pagada" && p.live === false && <span className="ml-2 text-grafito-600">(prueba)</span>}
                  </td>
                  <td className="px-4 py-3 text-negro">{planById(p.plan)?.name ?? p.plan}</td>
                  <td className="px-4 py-3 tabular-nums text-negro">{usd(Number(p.amount))}</td>
                  <td className="px-4 py-3">
                    {p.listing_id ? (
                      <Link to={`/casa/${p.listing_id}`} className="underline underline-offset-4">{p.listing_title}</Link>
                    ) : (
                      <span className="text-grafito-600">{p.listing_title} (borrado)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-grafito-700">{p.user_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
