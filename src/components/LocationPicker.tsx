"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const PIN = L.divIcon({
  className: "",
  html: '<span class="place-pin" aria-hidden="true"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

/**
 * Mapa para marcar dónde está la propiedad: se toca el mapa o se arrastra el pin.
 * `center` cambia al elegir otro distrito y mueve el pin a ese punto.
 */
export default function LocationPicker({
  center,
  value,
  onChange,
}: {
  center: { lat: number; lng: number };
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const emit = useRef(onChange);
  emit.current = onChange;

  useEffect(() => {
    if (!el.current) return;
    const start = value ?? center;
    const m = L.map(el.current, { scrollWheelZoom: false, center: [start.lat, start.lng], zoom: 14 });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(m);
    m.attributionControl.setPrefix(false);
    const pin = L.marker([start.lat, start.lng], { icon: PIN, draggable: true, keyboard: true }).addTo(m);
    const round = (n: number) => Math.round(n * 1e5) / 1e5;
    pin.on("dragend", () => {
      const p = pin.getLatLng();
      emit.current({ lat: round(p.lat), lng: round(p.lng) });
    });
    m.on("click", (e) => {
      pin.setLatLng(e.latlng);
      emit.current({ lat: round(e.latlng.lat), lng: round(e.latlng.lng) });
    });
    map.current = m;
    marker.current = pin;
    return () => {
      m.remove();
      map.current = null;
      marker.current = null;
    };
    // El mapa se crea una vez; los cambios posteriores entran por el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !marker.current || value) return;
    marker.current.setLatLng([center.lat, center.lng]);
    map.current.setView([center.lat, center.lng], 14);
  }, [center.lat, center.lng, value]);

  return (
    <div className="map-warm h-[320px] overflow-hidden rounded-card ring-1 ring-piedra-250 sm:h-[380px]">
      <div ref={el} className="size-full" role="application" aria-label="Mapa para marcar la ubicación" />
    </div>
  );
}
