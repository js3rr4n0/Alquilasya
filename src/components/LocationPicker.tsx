"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PIN = L.divIcon({
  className: "",
  html: '<span class="place-pin" aria-hidden="true"></span>',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

type Place = { name: string; detail: string; lat: number; lng: number };

const round = (n: number) => Math.round(n * 1e5) / 1e5;

/** Distancia aproximada en km (suficiente para avisar si el punto quedó lejos del distrito). */
function km(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dx = (a.lng - b.lng) * 111.3 * Math.cos((a.lat * Math.PI) / 180);
  const dy = (a.lat - b.lat) * 111.3;
  return Math.hypot(dx, dy);
}

/**
 * Mapa para marcar dónde está la propiedad: se busca un lugar conocido
 * («Metrocentro», «UCA», «colonia Escalón»), se toca el mapa o se arrastra el pin.
 * `center` cambia al elegir otro distrito y mueve el pin a ese punto.
 */
export default function LocationPicker({
  center,
  value,
  onChange,
  districtName,
}: {
  center: { lat: number; lng: number };
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number }) => void;
  districtName?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const emit = useRef(onChange);
  emit.current = onChange;

  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState("");
  // Al elegir un lugar se escribe su nombre en el buscador: eso no debe volver a buscar.
  const picked = useRef(false);

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

  // Buscar mientras se escribe, con una pausa para no consultar en cada tecla.
  useEffect(() => {
    const text = q.trim();
    if (picked.current) {
      picked.current = false;
      return;
    }
    if (text.length < 3) {
      setPlaces(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      const near = value ?? center;
      fetch(`/api/lugares?q=${encodeURIComponent(text)}&lat=${near.lat}&lng=${near.lng}`, { signal: ctrl.signal })
        .then((r) => r.json() as Promise<{ places: Place[] }>)
        .then((d) => {
          setPlaces(d.places ?? []);
          setActive(0);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 400);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
    // Solo el texto dispara la búsqueda; el sesgo hacia la zona no la repite.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function goTo(p: { lat: number; lng: number }, zoom = 17) {
    const point = { lat: round(p.lat), lng: round(p.lng) };
    marker.current?.setLatLng([point.lat, point.lng]);
    map.current?.setView([point.lat, point.lng], zoom);
    emit.current(point);
    const far = km(point, center);
    setNote(
      far > 8 && districtName
        ? `Ese punto queda a unos ${Math.round(far)} km de ${districtName}. Si la propiedad está en otro distrito, cámbialo arriba.`
        : "",
    );
  }

  function pick(p: Place) {
    goTo(p);
    picked.current = true;
    setQ(p.name);
    setPlaces(null);
    setOpen(false);
  }

  function locate() {
    if (!navigator.geolocation) return setNote("Tu navegador no permite usar la ubicación.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        goTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }, 18);
      },
      () => {
        setLocating(false);
        setNote("No pudimos leer tu ubicación. Revisa el permiso del navegador o busca el lugar.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return (
    <div>
      <div className="relative mb-3 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-grafito-600" aria-hidden />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => places && setOpen(true)}
            onBlur={() => window.setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (!open || !places?.length) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, places.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                pick(places[active]);
              } else if (e.key === "Escape") setOpen(false);
            }}
            placeholder="Busca un lugar cercano: Metrocentro, UCA, colonia…"
            aria-label="Buscar un lugar en el mapa"
            role="combobox"
            aria-expanded={open}
            aria-controls="lugares"
            aria-autocomplete="list"
            enterKeyHint="search"
            autoComplete="off"
            className="h-11 w-full rounded-ctl bg-crema-050 pl-9 pr-9 text-[15px] text-negro ring-1 ring-piedra-250 placeholder:text-grafito-600 focus:ring-negro"
          />
          {loading ? (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-grafito-600" aria-hidden />
          ) : (
            q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setPlaces(null);
                }}
                className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-ctl text-grafito-600 hover:bg-arena-200"
                aria-label="Borrar búsqueda"
              >
                <X className="size-4" />
              </button>
            )
          )}
          {open && places && (
            <ul
              id="lugares"
              role="listbox"
              className="absolute inset-x-0 top-full z-[1100] mt-1.5 max-h-72 overflow-y-auto rounded-card bg-crema-050 p-1.5 shadow-[0_18px_50px_-12px_rgb(10_10_10/0.35)] ring-1 ring-arena-200"
            >
              {places.length === 0 ? (
                <li className="px-3 py-2.5 text-[14px] text-grafito-600">
                  No encontramos ese lugar. Prueba con otro nombre cercano o toca el mapa.
                </li>
              ) : (
                places.map((p, i) => (
                  <li
                    key={`${p.name}-${p.lat}-${p.lng}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pick(p);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-ctl px-3 py-2.5 ${i === active ? "bg-arena-200" : ""}`}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-terracota-700" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-[15px] font-medium text-negro">{p.name}</span>
                      {p.detail && <span className="block text-[13px] text-grafito-600">{p.detail}</span>}
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-ctl bg-crema-050 px-3 text-[14px] font-medium text-negro ring-1 ring-piedra-250 hover:ring-negro disabled:opacity-60"
          title="Usar mi ubicación actual"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          <span className="hidden sm:inline">Estoy aquí</span>
          <span className="sr-only sm:hidden">Usar mi ubicación</span>
        </button>
      </div>
      <div className="map-warm h-[320px] overflow-hidden rounded-card ring-1 ring-piedra-250 sm:h-[380px]">
        <div ref={el} className="size-full" role="application" aria-label="Mapa para marcar la ubicación" />
      </div>
      {note && (
        <p role="status" className="mt-2 text-[14px] text-aviso">
          {note}
        </p>
      )}
    </div>
  );
}
