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

export function sendNewMessageNotice(to: string, from: string, listingTitle: string) {
  const url = `${SITE_URL}/mensajes`;
  const html = layout(
    "Tienes un mensaje nuevo",
    `${esc(from)} te escribió por <strong>${esc(listingTitle)}</strong>.<br><br>
<a href="${url}" style="display:inline-block;background:#a8410f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:600">Leer y responder</a>`,
  );
  return send(
    to,
    `Mensaje nuevo por ${listingTitle}`,
    html,
    `${from} te escribió por ${listingTitle}.\n\nLeer y responder: ${url}`,
  );
}
