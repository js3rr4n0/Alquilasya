"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Container } from "../components/ui";
import { useNavigate, useSearchParams } from "../lib/router";
import { useStore, type Account } from "../lib/store";
import { safeNext } from "./Auth";

/** Confirmar el correo con el código de 6 dígitos que llegó a la bandeja. */
export function Verify() {
  const { user, authLoaded, setUser, logout } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (!authLoaded) return;
    if (!user) navigate(`/entrar?next=${encodeURIComponent(next)}`, { replace: true });
    else if (user.verified) navigate(next, { replace: true });
  }, [authLoaded, user, next, navigate]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [wait]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) return setError("El código tiene 6 dígitos.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = (await res.json().catch(() => ({}))) as { user?: Account; error?: string };
    setBusy(false);
    if (!res.ok || !data.user) return setError(data.error ?? "No pudimos confirmar el código.");
    setUser(data.user);
    toast.success("Correo confirmado.");
    navigate(next, { replace: true });
  }

  async function resend() {
    setError("");
    setWait(60);
    const res = await fetch("/api/auth/verify", { method: "PUT" });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.ok) toast.success("Te enviamos un código nuevo.");
    else {
      setWait(0);
      setError(data.error ?? "No pudimos enviar el código.");
    }
  }

  if (!user || user.verified) return <div className="min-h-[60vh]" aria-busy="true" />;

  return (
    <Container className="py-14 lg:py-20">
      <div className="mx-auto max-w-[460px]">
        <p className="label text-terracota-700">Un paso más</p>
        <h1 className="serif mt-3 text-[44px] leading-[0.98] sm:text-[52px]">Confirma tu correo.</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-grafito-700">
          Enviamos un código de 6 dígitos a{" "}
          <strong className="font-semibold text-negro">{user.email}</strong>. Vence en 15 minutos.
          Si no lo ves, revisa la carpeta de correo no deseado.
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-8 space-y-5 rounded-card bg-crema-050 p-6 ring-1 ring-piedra-250 sm:p-8"
        >
          <label className="block">
            <span className="text-[14px] font-medium text-grafito-700">Código</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="mono mt-1.5 h-16 w-full rounded-ctl bg-crema-100 text-center text-[32px] font-medium tracking-[0.3em] text-negro ring-1 ring-piedra-250 outline-none placeholder:text-piedra-300 focus:ring-2 focus:ring-negro"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-ctl bg-error-bg px-3.5 py-2.5 text-[15px] font-medium text-error">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy || code.length !== 6}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Comprobando…
              </>
            ) : (
              <>
                Confirmar <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]">
            <button
              type="button"
              onClick={resend}
              disabled={wait > 0}
              className="font-medium text-terracota-700 underline underline-offset-4 disabled:text-grafito-600 disabled:no-underline"
            >
              {wait > 0 ? `Pedir otro en ${wait} s` : "Enviar un código nuevo"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                window.location.assign("/entrar?modo=crear");
              }}
              className="text-grafito-600 underline underline-offset-4"
            >
              Usar otro correo
            </button>
          </div>
        </form>
      </div>
    </Container>
  );
}
