"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button, Container, Segmented } from "../components/ui";
import { fieldClass } from "../components/WaitlistForm";
import { Link, useNavigate, useSearchParams } from "../lib/router";
import { useStore, type Account } from "../lib/store";

type Mode = "entrar" | "crear";

/** Solo rutas internas: evita que `?next=` mande a otro sitio. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
}

export function Auth() {
  const { user, authLoaded, setUser } = useStore();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<Mode>(params.get("modo") === "crear" ? "crear" : "entrar");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (authLoaded && user) navigate(next, { replace: true });
  }, [authLoaded, user, next, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "crear" && name.trim().length < 2) return setError("Escribe tu nombre.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Escribe un correo válido.");
    if (mode === "crear" && password.length < 8)
      return setError("La contraseña necesita al menos 8 caracteres.");
    if (mode === "crear" && whatsapp.trim() && !/^\+?[0-9\s\-]{8,20}$/.test(whatsapp.trim()))
      return setError("Revisa el número de WhatsApp.");

    setBusy(true);
    try {
      const res = await fetch(mode === "crear" ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "crear"
            ? { name: name.trim(), email: email.trim(), password, whatsapp: whatsapp.trim() }
            : { email: email.trim(), password },
        ),
      });
      const data = (await res.json().catch(() => ({}))) as { user?: Account; error?: string };
      if (!res.ok || !data.user) throw new Error(data.error ?? "No pudimos completar la solicitud.");
      setUser(data.user);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos completar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container className="py-14 lg:py-20">
      <div className="mx-auto max-w-[460px]">
        <p className="label text-terracota-700">Tu cuenta</p>
        <h1 className="serif mt-3 text-[44px] leading-[0.98] sm:text-[52px]">
          {mode === "crear" ? "Crea tu cuenta." : "Entra a tu cuenta."}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-grafito-700">
          Para buscar y leer anuncios no hace falta registro. La cuenta sirve para publicar y para
          ver los mensajes que recibes.
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-8 space-y-5 rounded-card bg-crema-050 p-6 ring-1 ring-piedra-250 sm:p-8"
        >
          <Segmented
            label="Entrar o crear cuenta"
            value={mode}
            onChange={(m: Mode) => {
              setMode(m);
              setError("");
            }}
            stretch
            options={[
              { value: "entrar", label: "Entrar" },
              { value: "crear", label: "Crear cuenta" },
            ]}
          />

          {mode === "crear" && (
            <label className="block">
              <span className="text-[14px] font-medium text-grafito-700">Nombre</span>
              <input
                type="text"
                autoComplete="name"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
              />
            </label>
          )}

          <label className="block">
            <span className="text-[14px] font-medium text-grafito-700">Correo electrónico</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>

          {mode === "crear" && (
            <label className="block">
              <span className="text-[14px] font-medium text-grafito-700">WhatsApp (opcional)</span>
              <input
                type="tel"
                autoComplete="tel"
                placeholder="+503 7000 0000"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className={fieldClass}
              />
            </label>
          )}

          <label className="block">
            <span className="text-[14px] font-medium text-grafito-700">Contraseña</span>
            <input
              type="password"
              autoComplete={mode === "crear" ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
            {mode === "crear" && (
              <span className="mt-1 block text-[14px] text-grafito-600">Mínimo 8 caracteres.</span>
            )}
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-ctl bg-error-bg px-3.5 py-2.5 text-[15px] font-medium text-error"
            >
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Un momento…
              </>
            ) : (
              <>
                {mode === "crear" ? "Crear cuenta" : "Entrar"} <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          {mode === "entrar" ? (
            <p className="text-[14px] leading-snug text-grafito-600">
              ¿Olvidaste tu contraseña? Escríbenos a{" "}
              <a href="mailto:hola@alquilasya.com" className="font-medium text-negro underline">
                hola@alquilasya.com
              </a>{" "}
              desde el correo de tu cuenta.
            </p>
          ) : (
            <p className="text-[14px] leading-snug text-grafito-600">
              Al crear la cuenta aceptas la{" "}
              <Link to="/privacidad" className="font-medium text-negro underline">
                privacidad y los términos
              </Link>
              .
            </p>
          )}
        </form>
      </div>
    </Container>
  );
}
