"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { MapPoint } from "../data/types";
import { DURATION, type DurationKey } from "../lib/durations";
import { money } from "../lib/format";

function pinHtml(l: MapPoint, duration: DurationKey) {
  const price = l.prices[duration];
  const label = price ? money(price) : "—";
  const unit = price ? DURATION[duration].unit.slice(0, 3).toUpperCase() : "N/D";
  return `<span class="price-pin" data-id="${l.id}">${label}<small>/${unit}</small></span>`;
}

export function ExploreMap({
  listings,
  duration,
  activeId,
  onActivate,
  onOpen,
  focus,
  className,
}: {
  /** Where to look when there are no results to frame. */
  focus?: { lat: number; lng: number; zoom: number };
  listings: MapPoint[];
  duration: DurationKey;
  activeId: string | null;
  onActivate: (id: string | null) => void;
  onOpen: (id: string) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const handlers = useRef({ onActivate, onOpen });
  handlers.current = { onActivate, onOpen };

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
      center: [13.75, -88.9],
      zoom: 9,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(m);
    m.attributionControl.setPrefix(false);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      layer.current = null;
      markers.current.clear();
    };
  }, []);

  // Dibuja los pines. Cuando varios caen a menos de CELL píxeles entre sí, se
  // agrupan en un círculo con el número; tocarlo acerca el mapa a ese grupo.
  const draw = useRef<() => void>(() => {});
  draw.current = () => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    markers.current.clear();
    const CELL = 64;
    const cells = new Map<string, MapPoint[]>();
    for (const l of listings) {
      const pt = m.latLngToLayerPoint([l.lat, l.lng]);
      const key = `${Math.floor(pt.x / CELL)}:${Math.floor(pt.y / CELL)}`;
      const list = cells.get(key);
      if (list) list.push(l);
      else cells.set(key, [l]);
    }
    for (const members of cells.values()) {
      if (members.length === 1) {
        const l = members[0];
        const marker = L.marker([l.lat, l.lng], {
          icon: L.divIcon({ className: "pin-anchor", html: pinHtml(l, duration), iconSize: [0, 0], iconAnchor: [0, 0] }),
          keyboard: true,
          title: l.title,
          riseOnHover: true,
        });
        marker.on("mouseover", () => handlers.current.onActivate(l.id));
        marker.on("mouseout", () => handlers.current.onActivate(null));
        marker.on("click", () => handlers.current.onOpen(l.id));
        marker.addTo(group);
        markers.current.set(l.id, marker);
        continue;
      }
      const lat = members.reduce((s, x) => s + x.lat, 0) / members.length;
      const lng = members.reduce((s, x) => s + x.lng, 0) / members.length;
      const size = members.length < 10 ? 38 : members.length < 100 ? 46 : 54;
      const cluster = L.marker([lat, lng], {
        icon: L.divIcon({
          className: "",
          html: `<span class="map-cluster" style="width:${size}px;height:${size}px">${members.length}</span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        keyboard: true,
        title: `${members.length} alquileres aquí. Acercar`,
      });
      cluster.on("click", () => {
        const bounds = L.latLngBounds(members.map((x) => [x.lat, x.lng] as [number, number]));
        // Si todos están en el mismo punto, acercar no los separa: se abre el primero.
        if (bounds.getNorthEast().equals(bounds.getSouthWest()) && m.getZoom() >= 16) {
          handlers.current.onOpen(members[0].id);
          return;
        }
        m.fitBounds(bounds.pad(0.3), { maxZoom: Math.min(18, m.getZoom() + 3) });
      });
      cluster.addTo(group);
    }
  };

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const redraw = () => draw.current();
    m.on("zoomend", redraw);
    return () => {
      m.off("zoomend", redraw);
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (listings.length) {
      const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
      m.fitBounds(bounds.pad(0.25), { maxZoom: 14, animate: false });
    } else if (focus) {
      m.setView([focus.lat, focus.lng], focus.zoom, { animate: false });
    }
    draw.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listings, duration, focus?.lat, focus?.lng, focus?.zoom]);

  useEffect(() => {
    markers.current.forEach((marker, id) => {
      const node = marker.getElement()?.querySelector(".price-pin");
      node?.classList.toggle("is-active", id === activeId);
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    });
  }, [activeId, listings, duration]);

  return <div ref={el} className={className} role="region" aria-label="Mapa de resultados" />;
}
