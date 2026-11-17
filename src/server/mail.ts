import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * Envío de correos con Resend (API HTTP, sin dependencia).
 * Variables: RESEND_API_KEY y MAIL_FROM («AlquilasYa <contacto@tu-dominio>»,
 * con el dominio verificado en Resend).
 */
export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export class MailError extends Error {}

const esc = (text: string) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function layout(heading: string, body: string) {
  return `<!doctype html><html lang="es"><body style="margin:0;background:#f5f2eb;font-family:Helvetica,Arial,sans-serif;color:#0a0a0a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fbf9f5;border:1px solid #d6ccbe;border-radius:6px">
<tr><td style="padding:28px 28px 8px;font-size:20px;font-weight:700">${SITE_NAME}</td></tr>
<tr><td style="padding:8px 28px 0;font-size:22px;font-weight:700;line-height:1.25">${heading}</td></tr>
<tr><td style="padding:12px 28px 28px;font-size:16px;line-height:1.55;color:#3b3129">${body}</td></tr>
</table>
<p style="font-size:13px;color:#6f6155;margin:16px 0 0">${SITE_NAME} · ${SITE_URL.replace(/^https?:\/\//, "")}</p>
</td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string) {
  if (!mailConfigured()) {
    // En desarrollo el correo se imprime en la consola para poder probar sin proveedor.
    if (process.env.NODE_ENV !== "production") {
      console.info(`[correo sin enviar] Para: ${to}\nAsunto: ${subject}\n${text}`);
      return;
    }
    throw new MailError("El envío de correos aún no está configurado.");
  }
  // MAIL_API_URL solo se usa en pruebas, para apuntar a un servidor de correo simulado.
  const res = await fetch(process.env.MAIL_API_URL ?? "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, html, text }),
  });
  if (!res.ok) {
    console.error("Resend", res.status, await res.text().catch(() => ""));
    throw new MailError("No pudimos enviar el correo. Intenta de nuevo en un momento.");
  }
}

export function sendCode(to: string, code: string, purpose: "verificar" | "restablecer") {
  const verify = purpose === "verificar";
  const heading = verify ? "Confirma tu correo" : "Cambia tu contraseña";
  const intro = verify
    ? "Usa este código para confirmar tu correo en AlquilasYa:"
    : "Usa este código para elegir una contraseña nueva en AlquilasYa:";
  const html = layout(
    heading,
    `${intro}
<div style="margin:18px 0;padding:16px;background:#0a0a0a;color:#f5f2eb;border-radius:6px;font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;font-family:Menlo,Consolas,monospace">${code}</div>
Vence en 15 minutos. Si no lo pediste, ignora este correo: nadie puede entrar a tu cuenta sin el código.`,
  );
  const text = `${intro}\n\n${code}\n\nVence en 15 minutos. Si no lo pediste, ignora este correo.`;
  return send(to, `${code} es tu código de AlquilasYa`, html, text);
}

const button = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#a8410f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:600">${esc(label)}</a>`;

/** Pie de los avisos que se pueden apagar. */
const optOut = `<p style="margin:24px 0 0;font-size:13px;color:#6f6155">¿No quieres estos avisos? Apágalos en <a href="${SITE_URL}/cuenta" style="color:#6f6155">Mi cuenta</a>.</p>`;
const optOutText = `\n\n¿No quieres estos avisos? Apágalos en ${SITE_URL}/cuenta`;

const snippet = (text: string) => (text.length > 220 ? `${text.slice(0, 217).trimEnd()}…` : text);

/** Mensaje nuevo en el chat. Se manda uno por racha: hasta que la persona lo lea, no hay otro. */
export function sendNewMessageNotice(to: string, from: string, listingTitle: string, body?: string) {
  const url = `${SITE_URL}/mensajes`;
  const quote = body
    ? `<blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #d6ccbe;background:#f5f2eb;color:#3b3129">${esc(snippet(body)).replace(/\n/g, "<br>")}</blockquote>`
    : "<br><br>";
  const html = layout(
    "Tienes un mensaje nuevo",
    `${esc(from)} te escribió por <strong>${esc(listingTitle)}</strong>.${quote}${button(url, "Leer y responder")}${optOut}`,
  );
  return send(
    to,
    `${from} te escribió por ${listingTitle}`,
    html,
    `${from} te escribió por ${listingTitle}.${body ? `\n\n«${snippet(body)}»` : ""}\n\nLeer y responder: ${url}${optOutText}`,
  );
}

/** El filtro automático dejó el anuncio en revisión: qué corregir. Siempre se manda. */
export function sendListingFlagged(to: string, listingTitle: string, listingId: string, reasons: string[]) {
  const url = `${SITE_URL}/publicar?editar=${encodeURIComponent(listingId)}`;
  const list = reasons.map((r) => `<li style="margin:4px 0">${esc(r)}</li>`).join("");
  const html = layout(
    "Tu anuncio necesita un cambio",
    `<strong>${esc(listingTitle)}</strong> no se publicó todavía porque nuestro filtro automático encontró esto:
<ul style="margin:12px 0;padding-left:20px">${list}</ul>
Corrígelo y, al guardar, se publica solo. Si crees que es un error, responde a este correo y lo revisamos.<br><br>
${button(url, "Corregir mi anuncio")}`,
  );
  return send(
    to,
    `Tu anuncio «${listingTitle}» necesita un cambio`,
    html,
    `${listingTitle} no se publicó todavía porque nuestro filtro encontró esto:\n- ${reasons.join("\n- ")}\n\nCorrígelo y se publica solo: ${url}`,
  );
}

/** El destacado vence pronto. */
export function sendFeaturedExpiring(to: string, listingTitle: string, until: Date) {
  const url = `${SITE_URL}/cuenta`;
  const when = new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: "America/El_Salvador" }).format(until);
  const html = layout(
    "Tu destacado vence pronto",
    `<strong>${esc(listingTitle)}</strong> deja de aparecer primero en las búsquedas el <strong>${when}</strong>. Después sigue publicado gratis como siempre.<br><br>
Si quieres que siga arriba, puedes extenderlo desde tu cuenta; los días se suman.<br><br>${button(url, "Extender destacado")}${optOut}`,
  );
  return send(
    to,
    `Tu destacado de «${listingTitle}» vence el ${when}`,
    html,
    `${listingTitle} deja de aparecer primero el ${when}. Sigue publicado gratis.\n\nExtender: ${url}${optOutText}`,
  );
}

/** Varias personas reportaron el anuncio y se ocultó mientras lo revisamos. Siempre se manda. */
export function sendListingHiddenByReports(to: string, listingTitle: string) {
  const html = layout(
    "Ocultamos tu anuncio mientras lo revisamos",
    `Varias personas reportaron <strong>${esc(listingTitle)}</strong>, así que lo ocultamos mientras lo revisamos. Si todo está en orden lo volvemos a publicar.<br><br>
Si quieres contarnos algo, responde a este correo o escribe a contacto@alquilasya.com.`,
  );
  return send(to, `Ocultamos «${listingTitle}» mientras lo revisamos`, html,
    `Varias personas reportaron ${listingTitle} y lo ocultamos mientras lo revisamos. Si quieres contarnos algo, escribe a contacto@alquilasya.com.`);
}

/** Aviso al admin: llegó un reporte. */
export function sendReportToAdmin(to: string, r: { listingTitle: string; listingId: string; reason: string; details?: string | null; reporter: string; open: number; hidden: boolean }) {
  const url = `${SITE_URL}/admin`;
  const html = layout(
    "Reportaron un anuncio",
    `<strong>${esc(r.listingTitle)}</strong><br>Motivo: ${esc(r.reason)}${r.details ? `<br>Detalle: «${esc(r.details)}»` : ""}<br>De: ${esc(r.reporter)}<br>Reportes abiertos: ${r.open}${r.hidden ? "<br><strong>Se ocultó automáticamente.</strong>" : ""}<br><br>
${button(`${SITE_URL}/casa/${encodeURIComponent(r.listingId)}`, "Ver anuncio")} &nbsp; <a href="${url}">Ir a Admin</a>`,
  );
  return send(to, `Reporte: ${r.listingTitle} (${r.reason})`, html,
    `${r.listingTitle}\nMotivo: ${r.reason}${r.details ? `\nDetalle: ${r.details}` : ""}\nDe: ${r.reporter}\nReportes abiertos: ${r.open}${r.hidden ? "\nSe ocultó automáticamente." : ""}\n\n${url}`);
}
