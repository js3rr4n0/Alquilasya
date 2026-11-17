import { ImageResponse } from "next/og";
import { SYMBOL_ARMS, SYMBOL_PILLAR } from "@/brand/logo-paths";
import { hasDatabase } from "@/lib/db";
import { getListing } from "@/server/listings";

const size = { width: 1200, height: 630 };

const money = (n: number) => `$${new Intl.NumberFormat("en-US").format(n)}`;

/**
 * Tarjeta de vista previa (WhatsApp, Facebook, X) para anuncios sin foto:
 * precio, tipo, tamaño y zona. Si el anuncio tiene foto, se comparte la foto
 * misma (más liviana; WhatsApp no muestra imágenes pesadas). Ver casa/[id]/page.tsx.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = hasDatabase() ? await getListing(decodeURIComponent(id)).catch(() => null) : null;

  const price = l
    ? l.prices.mes
      ? `${money(l.prices.mes)} al mes`
      : l.prices.semana
        ? `${money(l.prices.semana)} por semana`
        : l.prices.dia
          ? `${money(l.prices.dia)} por día`
          : ""
    : "";
  const rooms = l ? (l.bedrooms ? `${l.bedrooms} hab` : "1 ambiente") : "";
  const photo = null as string | null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0A0A0A", color: "#F5F2EB" }}>
        {photo && (
          <img src={photo} alt="" width={640} height={630} style={{ width: 640, height: 630, objectFit: "cover" }} />
        )}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: photo ? "56px 52px" : "72px 80px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 26, color: "#E5875A", letterSpacing: 2 }}>
              {l ? `${l.type.toUpperCase()} EN ALQUILER` : "ALQUILERES EN EL SALVADOR"}
            </div>
            {price && (
              <div style={{ fontSize: photo ? 64 : 84, fontWeight: 700, marginTop: 20, lineHeight: 1 }}>{price}</div>
            )}
            <div style={{ fontSize: photo ? 34 : 44, marginTop: 22, lineHeight: 1.2 }}>
              {l ? l.title.slice(0, 70) : "Todo claro antes de entrar."}
            </div>
            {l && (
              <div style={{ fontSize: 28, marginTop: 18, color: "#BDB2A5" }}>
                {`${rooms} · ${l.area} m² · ${l.zone}, ${l.region}`}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>AlquilasYa</div>
              <div style={{ fontSize: 22, color: "#BDB2A5", marginTop: 6 }}>
                Precio total y condiciones por escrito. Sin comisión.
              </div>
            </div>
            <svg width="70" height="76" viewBox="0 0 110 120">
              <path d={SYMBOL_ARMS} fill="#F5F2EB" />
              <path d={SYMBOL_PILLAR} fill="#D4541A" />
            </svg>
          </div>
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
