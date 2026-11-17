/**
 * Lectura del «user agent»: tipo de dispositivo, sistema y navegador, y si es
 * un robot. Sin dependencias; cubre lo que usa la gente en El Salvador.
 */

const BOT =
  /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp\/|telegrambot|discordbot|curl|wget|python|axios|node-fetch|go-http|java\/|httpclient|phantom|selenium|playwright|puppeteer|vercel-|uptime|monitor/i;

export const isBot = (ua: string) => !ua || BOT.test(ua);

export function parseUserAgent(ua: string) {
  const device = /ipad|tablet|kindle|silk|(android(?!.*mobile))/i.test(ua)
    ? "Tableta"
    : /mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)
      ? "Teléfono"
      : "Computadora";

  const os = /iphone|ipad|ipod/i.test(ua)
    ? "iOS"
    : /android/i.test(ua)
      ? "Android"
      : /windows/i.test(ua)
        ? "Windows"
        : /cros/i.test(ua)
          ? "ChromeOS"
          : /mac os x|macintosh/i.test(ua)
            ? "macOS"
            : /linux/i.test(ua)
              ? "Linux"
              : "Otro";

  // El orden importa: muchos navegadores se anuncian también como Chrome o Safari.
  const browser = /fban|fbav|fb_iab/i.test(ua)
    ? "Facebook (app)"
    : /instagram/i.test(ua)
      ? "Instagram (app)"
      : /tiktok|bytedance/i.test(ua)
        ? "TikTok (app)"
        : /edg\//i.test(ua)
          ? "Edge"
          : /opr\/|opera/i.test(ua)
            ? "Opera"
            : /samsungbrowser/i.test(ua)
              ? "Samsung Internet"
              : /firefox|fxios/i.test(ua)
                ? "Firefox"
                : /crios|chrome\//i.test(ua)
                  ? "Chrome"
                  : /safari/i.test(ua)
                    ? "Safari"
                    : "Otro";

  return { device, os, browser };
}
