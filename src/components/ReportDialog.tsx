"use client";

import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { cx } from "../lib/format";
import { Button, Modal } from "./ui";
import { fieldClass } from "./WaitlistForm";

const REASONS = [
  ["estafa", "Parece estafa o piden dinero antes de ver"],
  ["no_existe", "No existe o ya no está disponible"],
  ["datos_falsos", "Precio, fotos o datos falsos"],
  ["ofensivo", "Contenido ofensivo o discriminatorio"],
  ["otro", "Otro motivo"],
] as const;

type Reason = (typeof REASONS)[number][0];

/** «Reportar este anuncio»: llega al admin; con varios reportes el anuncio se oculta solo. */
export function ReportButton({ listingId, className }: { listingId: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return setError("Elige un motivo.");
    setSending(true);
    setError("");
    const res = await fetch("/api/reportes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, reason, details: details.trim() || undefined }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSending(false);
    if (!res.ok) return setError(data.error ?? "No pudimos enviar el reporte. Intenta de nuevo.");
    setDone(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cx("inline-flex items-center gap-1.5 text-[14px] text-grafito-600 underline-offset-4 hover:text-negro hover:underline", className)}
      >
        <Flag className="size-3.5" aria-hidden /> Reportar este anuncio
      </button>
      <Modal open={open} onClose={() => setOpen(false)} label="Reportar anuncio" title="Reportar este anuncio">
        {done ? (
          <div className="p-6">
            <p className="text-[17px] font-semibold text-negro">Gracias, lo vamos a revisar.</p>
            <p className="mt-2 text-[15px] leading-relaxed text-grafito-700">
              Si varias personas reportan el mismo anuncio, lo ocultamos mientras lo revisamos. Nunca pagues ni
              dejes depósito sin haber visitado el inmueble.
            </p>
            <Button variant="ink" className="mt-5" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 p-6">
            <fieldset>
              <legend className="text-[15px] font-medium text-grafito-700">¿Qué pasa con este anuncio?</legend>
              <div className="mt-3 space-y-2">
                {REASONS.map(([key, label]) => (
                  <label
                    key={key}
                    className={cx(
                      "flex cursor-pointer items-center gap-3 rounded-ctl px-3.5 py-3 text-[15px] ring-1 transition",
                      reason === key ? "bg-crema-100 ring-negro" : "ring-piedra-250 hover:ring-grafito-600",
                    )}
                  >
                    <input
                      type="radio"
                      name="motivo"
                      value={key}
                      checked={reason === key}
                      onChange={() => setReason(key)}
                      className="size-4 accent-terracota-600"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-[14px] font-medium text-grafito-700">Cuéntanos más (opcional)</span>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={600}
                rows={3}
                placeholder="Por ejemplo: me pidió depositar antes de ver la casa."
                className={cx(fieldClass, "h-auto py-2.5")}
              />
            </label>
            {error && (
              <p role="alert" className="text-[14px] font-medium text-error">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : null} Enviar reporte
            </Button>
            <p className="text-[13px] text-grafito-600">No le decimos al anunciante quién lo reportó.</p>
          </form>
        )}
      </Modal>
    </>
  );
}
