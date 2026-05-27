'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Zod schema for client-side validation, ensuring data integrity before network request
const formSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  whatsapp: z.string().min(8, 'Número inválido').max(30, 'Número inválido'),
  tipo_usuario: z.enum(['inquilino', 'propietario'], {
    message: 'Selecciona una opción',
  }),
  departamento: z.string().min(1, 'Selecciona tu departamento').max(100),
  email: z.string().email('Ingresa un correo válido').max(255),
});

// Infering the type from our schema for strict type safety
type FormData = z.infer<typeof formSchema>;

// Geographic options (Assumed El Salvador 14 departments based on context)
const DEPARTAMENTOS = [
  'Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad',
  'La Paz', 'La Unión', 'Morazán', 'San Miguel', 'San Salvador',
  'San Vicente', 'Santa Ana', 'Sonsonate', 'Usulután'
];

export default function WaitlistForm({ onSuccess }: { onSuccess?: () => void }) {
  const [isSuccess, setIsSuccess] = useState(false);

  // Integrating react-hook-form with Zod for robust validation
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_usuario: undefined,
      departamento: '',
    },
  });

  const selectedTipo = watch('tipo_usuario');

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error inesperado');
      }

      setIsSuccess(true);
      toast.success(result.message);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">¡Registro Exitoso!</h3>
        <p className="text-gray-600">
          Gracias por unirte a nuestra waitlist. Te notificaremos al correo registrado tan pronto como lancemos.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Únete a la Waitlist</h2>
        <p className="text-gray-500">Sé de los primeros en acceder a nuestra plataforma.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label htmlFor="nombre" className="text-sm font-semibold text-gray-700 block">
            Nombre y Apellido
          </label>
          <input
            id="nombre"
            type="text"
            placeholder="Ej. Carlos"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
            {...register('nombre')}
          />
          {errors.nombre && <span className="text-red-500 text-xs font-medium">{errors.nombre.message}</span>}
        </div>

        {/* WhatsApp Field */}
        <div className="space-y-2">
          <label htmlFor="whatsapp" className="text-sm font-semibold text-gray-700 block">
            WhatsApp principal
          </label>
          <input
            id="whatsapp"
            type="tel"
            placeholder="Ej. +503 7000 0000"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
            {...register('whatsapp')}
          />
          {errors.whatsapp && <span className="text-red-500 text-xs font-medium">{errors.whatsapp.message}</span>}
        </div>

        {/* User Type Buttons (Tenant or Owner) */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 block">
            ¿Eres Inquilino o Propietario?
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setValue('tipo_usuario', 'inquilino', { shouldValidate: true })}
              className={`py-3 px-4 rounded-xl font-medium border-2 transition-all duration-200 flex justify-center items-center ${selectedTipo === 'inquilino'
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
            >
              Inquilino
            </button>
            <button
              type="button"
              onClick={() => setValue('tipo_usuario', 'propietario', { shouldValidate: true })}
              className={`py-3 px-4 rounded-xl font-medium border-2 transition-all duration-200 flex justify-center items-center ${selectedTipo === 'propietario'
                  ? 'bg-black text-white border-black shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
            >
              Propietario
            </button>
          </div>
          {errors.tipo_usuario && (
            <span className="text-red-500 text-xs font-medium block">{errors.tipo_usuario.message}</span>
          )}
        </div>

        {/* Department Dropdown */}
        <div className="space-y-2">
          <label htmlFor="departamento" className="text-sm font-semibold text-gray-700 block">
            Departamento
          </label>
          <select
            id="departamento"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none bg-white appearance-none"
            {...register('departamento')}
          >
            <option value="" disabled>Selecciona una opción</option>
            {DEPARTAMENTOS.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
          </select>
          {errors.departamento && (
            <span className="text-red-500 text-xs font-medium">{errors.departamento.message}</span>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold text-gray-700 block">
            Correo Electrónico (Obligatorio)
          </label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-transparent transition-all outline-none"
            {...register('email')}
          />
          {errors.email && <span className="text-red-500 text-xs font-medium">{errors.email.message}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-4 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            'Unirse ahora'
          )}
        </button>
      </form>
    </div>
  );
}
