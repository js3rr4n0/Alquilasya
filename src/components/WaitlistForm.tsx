"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { cx } from "@/lib/format";
import { buttonClass } from "./ui";

const formSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre").max(100),
  whatsapp: z.string().regex(/^\+?[0-9\s\-]{8,20}$/, "Número de WhatsApp inválido"),
  tipo_usuario: z.enum(["inquilino", "propietario"], { message: "Elige una opción" }),
  departamento: z.string().min(1, "Elige tu departamento").max(100),
  email: z.string().email("Escribe un correo válido").max(255),
});

type FormData = z.infer<typeof formSchema>;

const DEPARTAMENTOS = [
  "Ahuachapán",
  "Cabañas",
  "Chalatenango",
  "Cuscatlán",
  "La Libertad",
  "La Paz",
  "La Unión",
  "Morazán",
  "San Miguel",
  "San Salvador",
  "San Vicente",
  "Santa Ana",
  "Sonsonate",
  "Usulután",
];

export const fieldClass =
  "mt-1.5 h-12 w-full rounded-ctl bg-crema-100 px-3.5 text-[16px] text-negro ring-1 ring-piedra-250 outline-none transition-shadow placeholder:text-piedra-400 focus:ring-2 focus:ring-negro";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[14px] font-medium text-grafito-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[14px] font-medium text-error">{error}</span>}
    </label>
  );
}

export default function WaitlistForm({
  defaultTipo,
  onSuccess,
}: {
  defaultTipo?: "inquilino" | "propietario";
  onSuccess?: () => void;
}) {
  const [done, setDone] = useState(false);
  const [origen, setOrigen] = useState("organico");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setOrigen(ref.slice(0, 60));
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { tipo_usuario: defaultTipo, departamento: "" },
  });

  const tipo = watch("tipo_usuario");

  async function onSubmit(data: FormData) {
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, origen }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Ocurrió un error inesperado");
      setDone(true);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ocurrió un error inesperado");
    }
  }

  if (done) {
    return (
      <div className="rounded-card bg-crema-050 p-7 ring-1 ring-piedra-250 sm:p-9" role="status">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-exito-bg text-exito">
          <Check className="size-5" strokeWidth={2.2} />
        </span>
        <h3 className="head mt-5 text-[28px]">Ya estás en la lista.</h3>
        <p className="mt-2 max-w-[42ch] text-[16px] leading-relaxed text-grafito-700">
          Te escribiremos al correo que dejaste antes del lanzamiento. Solo lo usamos para eso.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5 rounded-card bg-crema-050 p-6 ring-1 ring-piedra-250 sm:p-8"
    >
      <div>
        <span className="text-[14px] font-medium text-grafito-700">¿Buscas o publicas?</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de usuario">
          {(
            [
              { v: "inquilino", label: "Busco alquiler" },
              { v: "propietario", label: "Tengo un inmueble" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              type="button"
              role="radio"
              aria-checked={tipo === o.v}
              onClick={() => setValue("tipo_usuario", o.v, { shouldValidate: true })}
              className={cx(
                "h-12 rounded-ctl px-3 text-[15px] font-medium ring-1 transition-colors",
                tipo === o.v
                  ? "bg-negro text-crema-100 ring-negro"
                  : "bg-crema-100 text-grafito-700 ring-piedra-250 hover:ring-negro",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        {errors.tipo_usuario && (
          <span className="mt-1 block text-[14px] font-medium text-error">
            {errors.tipo_usuario.message}
          </span>
        )}
      </div>

      <Field label="Correo electrónico" error={errors.email?.message}>
        <input
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          className={fieldClass}
          {...register("email")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Nombre" error={errors.nombre?.message}>
          <input
            type="text"
            autoComplete="name"
            placeholder="Nombre y apellido"
            className={fieldClass}
            {...register("nombre")}
          />
        </Field>
        <Field label="WhatsApp" error={errors.whatsapp?.message}>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+503 7000 0000"
            className={fieldClass}
            {...register("whatsapp")}
          />
        </Field>
      </div>

      <Field label="Departamento" error={errors.departamento?.message}>
        <select className={fieldClass} {...register("departamento")}>
          <option value="" disabled>
            Elige una opción
          </option>
          {DEPARTAMENTOS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className={buttonClass("primary", "lg", "w-full")}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Enviando…
          </>
        ) : (
          <>
            Unirse a la lista <ArrowRight className="size-4" />
          </>
        )}
      </button>
      <p className="text-[14px] leading-snug text-grafito-600">
        Solo se usa para avisarte del lanzamiento. Puedes pedir la baja cuando quieras.
      </p>
    </form>
  );
}
