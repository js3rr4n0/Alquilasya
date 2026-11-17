"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button, Container, Segmented } from "../components/ui";
import { fieldClass } from "../components/WaitlistForm";
import { Link, useNavigate, useSearchParams } from "../lib/router";
import { useStore, type Account } from "../lib/store";

type Mode = "entrar" | "crear" | "olvide" | "nueva";

/** Solo rutas internas: evita que `?next=` mande a otro sitio. */
export function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/cuenta";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TITLE: Record<Mode, string> = {
  entrar: "Entra a tu cuenta.",
  crear: "Crea tu cuenta.",
  olvide: "Recupera tu cuenta.",
  nueva: "Elige una contraseña nueva.",
};

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
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const after = (u: Account) =>
    u.verified ? next : `/verificar?next=${encodeURIComponent(next)}`;

  useEffect(() => {
    if (authLoaded && user) navigate(after(user), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, user, next, navigate]);

  async function call(url: string, method: string, body: unknown) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      user?: Account;
      error?: string;
      mailError?: string | null;
    };
    if (!res.ok) throw new Error(data.error ?? "No pudimos completar la solicitud.");
    return data;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const mail = email.trim();
    if (mode === "crear" && name.trim().length < 2) return setError("Escribe tu nombre.");
    if (!EMAIL.test(mail)) return setError("Escribe un correo válido.");
    if ((mode === "crear" || mode === "nueva") && password.length < 8)
      return setError("La contraseña necesita al menos 8 caracteres.");
    if (mode === "crear" && whatsapp.trim() && !/^\+?[0-9\s\-]{8,20}$/.test(whatsapp.trim()))
      return setError("Revisa el número de WhatsApp.");
    if (mode === "nueva" && !/^\d{6}$/.test(code)) return setError("El código tiene 6 dígitos.");

    setBusy(true);
    try {
      if (mode === "olvide") {
        await call("/api/auth/reset", "PUT", { email: mail });
        setMode("nueva");
        setPassword("");
        toast.success("Si hay una cuenta con ese correo, le enviamos un código.");
        return;
      }
      const data =
        mode === "crear"
          ? await call("/api/auth/register", "POST", {
              name: name.trim(),
              email: mail,
              password,
              whatsapp: whatsapp.trim(),
            })
          : mode === "nueva"
            ? await call("/api/auth/reset", "POST", { email: mail, code, password })
            : await call("/api/auth/login", "POST", { email: mail, password });
      if (!data.user) throw new Error("No pudimos completar la solicitud.");
      if (data.mailError) toast.error(data.mailError);
      setUser(data.user);
      navigate(after(data.user), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos completar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  const switchTo = (m: Mode) => {
    setMode(m);
    setError("");
  };

  return (
    <Container className="py-14 lg:py-20">
      <div className="mx-auto max-w-[460px]">
        <p className="label text-terracota-700">Tu cuenta</p>
        <h1 className="serif mt-3 text-[44px] leading-[0.98] sm:text-[52px]">{TITLE[mode]}</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-grafito-700">
          {mode === "olvide"
            ? "Escribe el correo de tu cuenta y te enviamos un código para elegir una contraseña nueva."
            : mode === "nueva"
              ? "Escribe el código que llegó a tu correo y tu contraseña nueva."
              : "Para buscar y leer anuncios no hace falta registro. La cuenta sirve para publicar y para chatear."}
        </p>

        <form
          onSubmit={submit}
          noValidate
          className="mt-8 space-y-5 rounded-card bg-crema-050 p-6 ring-1 ring-piedra-250 sm:p-8"
        >
          {(mode === "entrar" || mode === "crear") && (
            <Segmented
              label="Entrar o crear cuenta"
              value={mode}
              onChange={switchTo}
              stretch
              options={[
                { value: "entrar", label: "Entrar" },
                { value: "crear", label: "Crear cuenta" },
              ]}
            />
          )}

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
              readOnly={mode === "nueva"}
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

          {mode === "nueva" && (
            <label className="block">
              <span className="text-[14px] font-medium text-grafito-700">Código de 6 dígitos</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${fieldClass} mono tracking-[0.3em]`}
              />
            </label>
          )}

          {mode !== "olvide" && (
            <label className="block">
              <span className="text-[14px] font-medium text-grafito-700">
                {mode === "nueva" ? "Contraseña nueva" : "Contraseña"}
              </span>
              <input
                type="password"
                autoComplete={mode === "entrar" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldClass}
              />
              {mode !== "entrar" && (
                <span className="mt-1 block text-[14px] text-grafito-600">Mínimo 8 caracteres.</span>
              )}
            </label>
          )}

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
                {mode === "crear"
                  ? "Crear cuenta"
                  : mode === "olvide"
                    ? "Enviar código"
                    : mode === "nueva"
                      ? "Cambiar contraseña"
                      : "Entrar"}{" "}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>

          {mode === "entrar" && (
            <button
              type="button"
              onClick={() => switchTo("olvide")}
              className="text-[14px] font-medium text-terracota-700 underline underline-offset-4"
            >
              Olvidé mi contraseña
            </button>
          )}
          {(mode === "olvide" || mode === "nueva") && (
            <button
              type="button"
              onClick={() => switchTo("entrar")}
              className="text-[14px] text-grafito-600 underline underline-offset-4"
            >
              Volver a entrar
            </button>
          )}
          {mode === "crear" && (
            <p className="text-[14px] leading-snug text-grafito-600">
              Te enviaremos un código para confirmar el correo. Al crear la cuenta aceptas la{" "}
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
