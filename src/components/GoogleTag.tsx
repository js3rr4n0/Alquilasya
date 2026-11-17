import Script from "next/script";

/**
 * Etiqueta de Google (GA4 y, opcionalmente, Google Ads). Solo se carga si
 * existe NEXT_PUBLIC_GA_ID; sin esa variable el sitio no usa cookies de medición.
 */
export function GoogleTag() {
  const ga = process.env.NEXT_PUBLIC_GA_ID;
  const ads = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (!ga || !/^G-[A-Z0-9]+$/.test(ga)) return null;
  const adsOk = ads && /^AW-[0-9]+$/.test(ads);
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${ga}');${adsOk ? `gtag('config','${ads}');` : ""}`}
      </Script>
    </>
  );
}
