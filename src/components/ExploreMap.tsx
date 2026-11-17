"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Listing } from "../data/types";
import { DURATION, type DurationKey } from "../lib/durations";
import { money } from "../lib/format";

function pinHtml(l: Listing, duration: DurationKey) {
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
  listings: Listing[];
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

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    markers.current.clear();
    for (const l of listings) {
      const marker = L.marker([l.lat, l.lng], {
        icon: L.divIcon({
          className: "pin-anchor",
          html: pinHtml(l, duration),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        keyboard: true,
        title: l.title,
        riseOnHover: true,
      });
      marker.on("mouseover", () => handlers.current.onActivate(l.id));
      marker.on("mouseout", () => handlers.current.onActivate(null));
      marker.on("click", () => handlers.current.onOpen(l.id));
      marker.addTo(group);
      markers.current.set(l.id, marker);
    }
    if (listings.length) {
      const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng] as [number, number]));
      m.fitBounds(bounds.pad(0.25), { maxZoom: 14, animate: false });
    } else if (focus) {
      m.setView([focus.lat, focus.lng], focus.zoom, { animate: false });
    }
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
