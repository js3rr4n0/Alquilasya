import { query } from "@/lib/db";
import { mailConfigured, sendFeaturedExpiring } from "./mail";

/**
 * Avisos programados (una vez al día, desde /api/cron/avisos).
 * Destacados que vencen en los próximos 2 días: un aviso por periodo destacado.
 * Si el dueño lo extiende, la fecha cambia y vuelve a avisarse antes del nuevo fin.
 */
export async function sendDailyNotices() {
  if (!mailConfigured()) return { featured: 0, skipped: "correo sin configurar" };
  const rows = await query<{ id: string; title: string; featured_until: string; email: string }>(
    `UPDATE listings l SET featured_notice_for = l.featured_until
       FROM users u
      WHERE u.id = l.user_id AND u.email_notices AND l.status = 'publicada'
        AND l.featured_until > now() AND l.featured_until <= now() + interval '2 days'
        AND l.featured_notice_for IS DISTINCT FROM l.featured_until
      RETURNING l.id, l.title, l.featured_until, u.email`,
  );
  let sent = 0;
  for (const r of rows) {
    try {
      await sendFeaturedExpiring(r.email, r.title, new Date(r.featured_until));
      sent++;
    } catch (error) {
      console.error("aviso de destacado", r.id, error);
      // Si no salió, se intenta otra vez mañana.
      await query("UPDATE listings SET featured_notice_for = NULL WHERE id = $1", [r.id]).catch(() => {});
    }
  }
  return { featured: sent };
}
