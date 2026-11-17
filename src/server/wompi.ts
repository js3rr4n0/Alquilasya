import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Cliente mínimo del API de Wompi El Salvador (https://docs.wompi.sv).
 * Autenticación OAuth 2.0 client credentials; el token dura una hora y se reutiliza.
 */

// Las variables *_URL solo se usan en pruebas, para apuntar a un Wompi simulado.
const ID_URL = process.env.WOMPI_ID_URL ?? "https://id.wompi.sv/connect/token";
const API = process.env.WOMPI_API_URL ?? "https://api.wompi.sv";

export class WompiError extends Error {}

export const wompiConfigured = () => Boolean(process.env.WOMPI_APP_ID && process.env.WOMPI_API_SECRET);

let cached: { token: string; until: number } | null = null;

async function token() {
  if (cached && cached.until > Date.now()) return cached.token;
  const res = await fetch(ID_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      audience: "wompi_api",
      client_id: process.env.WOMPI_APP_ID ?? "",
      client_secret: process.env.WOMPI_API_SECRET ?? "",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new WompiError(`Wompi rechazó las credenciales (${res.status}).`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: data.access_token, until: Date.now() + (data.expires_in - 120) * 1000 };
  return data.access_token;
}

async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? "GET",
    headers: { authorization: `Bearer ${await token()}`, "content-type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status === 401) cached = null;
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new WompiError(`Wompi ${init.method ?? "GET"} ${path} → ${res.status} ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export type WompiLink = {
  idEnlace: number;
  urlEnlace: string;
  /** Dirección directa, sin el salto del enlace corto. */
  urlEnlaceLargo?: string;
  urlQrCodeEnlace: string;
  estaProductivo: boolean;
};

export function createPaymentLink(input: {
  reference: string;
  amount: number;
  product: string;
  description: string;
  redirectUrl: string;
  returnUrl: string;
  webhookUrl: string;
  notifyEmails?: string;
  expiresAt: Date;
}) {
  return api<WompiLink>("/EnlacePago", {
    method: "POST",
    body: {
      identificadorEnlaceComercio: input.reference,
      monto: input.amount,
      nombreProducto: input.product,
      formaPago: {
        permitirTarjetaCreditoDebido: true,
        permitirPagoConPuntoAgricola: true,
        permitirPagoEnCuotasAgricola: false,
        permitirPagoEnBitcoin: false,
        permitePagoQuickPay: false,
      },
      infoProducto: { descripcionProducto: input.description },
      configuracion: {
        urlRedirect: input.redirectUrl,
        urlRetorno: input.returnUrl,
        urlWebhook: input.webhookUrl,
        emailsNotificacion: input.notifyEmails || undefined,
        esMontoEditable: false,
        esCantidadEditable: false,
        cantidadPorDefecto: 1,
        notificarTransaccionCliente: true,
      },
      // Sin fecha de inicio: vale desde ya y no depende de que los relojes coincidan.
      vigencia: { fechaFin: input.expiresAt.toISOString() },
      limitesDeUso: { cantidadMaximaPagosExitosos: 1 },
    },
  });
}

export type WompiTransaction = {
  idTransaccion: string;
  esReal: boolean;
  esAprobada: boolean;
  monto: number;
  mensaje?: string;
  fechaTransaccion?: string;
};

type LinkDetail = {
  idEnlace: number;
  monto: number;
  usable: boolean;
  transaccionCompra?: WompiTransaction | null;
  transacciones?: WompiTransaction[] | null;
};

/** Estado de un enlace según Wompi: es la fuente de verdad para saber si se pagó. */
export async function linkStatus(linkId: number) {
  const link = await api<LinkDetail>(`/EnlacePago/${linkId}`);
  const all = [link.transaccionCompra, ...(link.transacciones ?? [])].filter(Boolean) as WompiTransaction[];
  return { approved: all.find((t) => t.esAprobada) ?? null, attempts: all, usable: link.usable };
}

/** HMAC-SHA256 en hexadecimal con el API Secret, como firma Wompi webhooks y redirecciones. */
export function signatureMatches(text: string, hash: string | null | undefined) {
  if (!hash || !process.env.WOMPI_API_SECRET) return false;
  const expected = createHmac("sha256", process.env.WOMPI_API_SECRET).update(text, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(hash.trim().toLowerCase());
  return a.length === b.length && timingSafeEqual(a, b);
}
