import { ImageResponse } from "next/og";
import { SYMBOL_ARMS, SYMBOL_PILLAR } from "@/brand/logo-paths";

export const alt = "AlquilasYa · Alquileres en El Salvador, con todo claro antes de entrar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Imagen que se ve al compartir el sitio en WhatsApp, Facebook o X. */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          background: "#0A0A0A",
          color: "#F5F2EB",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 720 }}>
          <div style={{ fontSize: 30, color: "#E5875A", letterSpacing: 2 }}>
            ALQUILERES EN EL SALVADOR
          </div>
          <div style={{ fontSize: 92, lineHeight: 1, marginTop: 24, fontWeight: 600 }}>
            Todo claro antes de entrar.
          </div>
          <div style={{ fontSize: 32, marginTop: 28, color: "#BDB2A5" }}>
            Precio total, depósito, plano y condiciones por escrito. Sin comisión.
          </div>
          <div style={{ fontSize: 34, marginTop: 44, fontWeight: 600 }}>AlquilasYa</div>
        </div>
        <svg width="300" height="330" viewBox="0 0 110 120">
          <path d={SYMBOL_ARMS} fill="#F5F2EB" />
          <path d={SYMBOL_PILLAR} fill="#D4541A" />
        </svg>
      </div>
    ),
    size,
  );
}
