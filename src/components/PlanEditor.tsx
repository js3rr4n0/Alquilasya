"use client";

import { toast } from "sonner";
import { uploadPhoto } from "../lib/upload";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Move,
  Undo2,
  Copy,
  Eye,
  ImagePlus,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  area as roomArea,
  ROOM_ORDER,
  ROOM_TYPES,
  VIEW_OPTIONS,
} from "../data/rooms";
import type { Floor, Room, RoomType } from "../data/types";
import { cx, dec, m2 } from "../lib/format";
import { photoUrl } from "../lib/photos";
import {
  fitLabel,
  MetreGrid,
  NorthArrow,
  PlanDefs,
  PlanExplorer,
  RoomDimensions,
  ScaleBar,
  UNITS,
  useUnitsPerPixel,
} from "./FloorPlan";
import { Button, Segmented } from "./ui";

const SNAP = 0.5;
const snap = (n: number) => Math.round(n / SNAP) * SNAP;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function overlaps(a: Room, b: Room) {
  return (
    a.x < b.x + b.w - 0.01 &&
    a.x + a.w > b.x + 0.01 &&
    a.y < b.y + b.h - 0.01 &&
    a.y + a.h > b.y + 0.01
  );
}

function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  return ctm ? pt.matrixTransform(ctm.inverse()) : { x: 0, y: 0 };
}

/**
 * Número en metros que se escribe con libertad (borrar, «35», «4,75»). Se aplica al
 * terminar (salir del campo o Enter) tal como se escribió: sin mínimo ni máximo.
 */
function MetresField({
  value,
  onCommit,
  className,
  ariaLabel,
}: {
  value: number;
  onCommit: (v: number) => void;
  className?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState(String(value).replace(".", ","));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(String(value).replace(".", ","));
  }, [value, editing]);

  function commit() {
    setEditing(false);
    const n = Number(text.replace(",", ".").replace(/[^\d.]/g, ""));
    if (!text.trim() || !Number.isFinite(n) || n <= 0) {
      setText(String(value).replace(".", ","));
      return;
    }
    // Tal cual, con dos decimales como mucho.
    const v = Math.round(n * 100) / 100;
    onCommit(v);
    setText(String(v).replace(".", ","));
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      aria-label={ariaLabel}
      value={text}
      onFocus={(e) => {
        setEditing(true);
        e.currentTarget.select();
      }}
      onChange={(e) => setText(e.target.value.slice(0, 6))}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      className={className}
    />
  );
}

/**
 * Teléfono o tableta: el plano solo se mira y se toca para elegir (sin arrastrar,
 * para que la página se pueda desplazar), y los espacios se editan en una lista.
 */
function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px), (pointer: coarse)");
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return compact;
}

/** Primer lugar libre (de arriba a la izquierda) donde cabe una pieza de w × h; null si no hay. */
function findSlot(floor: Floor, w: number, h: number, ignoreId?: string) {
  for (let y = 0; y <= floor.height - h + 1e-9; y += 0.5) {
    for (let x = 0; x <= floor.width - w + 1e-9; x += 0.5) {
      const probe: Room = { id: "_", type: "sala", name: "", x, y, w, h, photos: [] };
      if (!floor.rooms.some((r) => r.id !== ignoreId && overlaps(probe, r))) return { x, y };
    }
  }
  return null;
}

/**
 * Como un rompecabezas de piezas deslizantes: la pieza avanza de medio metro en
 * medio metro hacia donde se la lleva y se detiene al topar con otra pieza o con
 * el borde del terreno. Nunca queda encima de otra.
 */
function slideRoom(floor: Floor, room: Room, tx: number, ty: number) {
  const free = (x: number, y: number) =>
    x >= -1e-9 &&
    y >= -1e-9 &&
    x + room.w <= floor.width + 1e-9 &&
    y + room.h <= floor.height + 1e-9 &&
    !floor.rooms.some((o) => o.id !== room.id && overlaps({ ...room, x, y }, o));
  const walk = (order: "xy" | "yx") => {
    let { x, y } = room;
    for (const axis of order === "xy" ? ["x", "y"] : ["y", "x"]) {
      const target = axis === "x" ? tx : ty;
      const step = Math.sign(target - (axis === "x" ? x : y)) * SNAP;
      while (step && Math.abs(target - (axis === "x" ? x : y)) >= SNAP / 2) {
        const nx = axis === "x" ? x + step : x;
        const ny = axis === "y" ? y + step : y;
        if (!free(nx, ny)) break;
        x = nx;
        y = ny;
      }
    }
    return { x, y };
  };
  // Se prueba en los dos órdenes y se queda el que llega más cerca de donde va el dedo.
  const a = walk("xy");
  const b = walk("yx");
  const d = (p: { x: number; y: number }) => Math.hypot(p.x - tx, p.y - ty);
  return d(a) <= d(b) ? a : b;
}

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "'Instrument Sans', ui-sans-serif, sans-serif";

export function PlanEditor({
  floors,
  onChange,
  onReset,
  title,
}: {
  floors: Floor[];
  onChange: (next: Floor[]) => void;
  onReset?: () => void;
  title: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [floorIdx, setFloorIdx] = useState(0);
  const floor = floors[Math.min(floorIdx, floors.length - 1)] ?? floors[0];
  const [selectedId, setSelectedId] = useState<string | null>(floor?.rooms[0]?.id ?? null);
  const [mode, setMode] = useState<"editar" | "inquilino">("editar");
  const compact = useCompact();
  const [adding, setAdding] = useState(false);
  // En el teléfono, al elegir un espacio se lleva la vista a su ficha abierta
  // (no al cargar: la página no debe saltar sola).
  const firstSelection = useRef(selectedId);
  const arrangingRef = useRef(false);
  useEffect(() => {
    // Mientras se acomodan las piezas, la vista no se mueve sola.
    if (!compact || arrangingRef.current || !selectedId || selectedId === firstSelection.current) return;
    firstSelection.current = null;
    const t = window.setTimeout(
      () => document.getElementById(`espacio-${selectedId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      60,
    );
    return () => window.clearTimeout(t);
  }, [compact, selectedId]);
  // Mover las piezas con el dedo en el teléfono (si no, el plano deja desplazar la página).
  const [arranging, setArranging] = useState(false);
  arrangingRef.current = arranging;

  /* ——— Deshacer ——— */
  const history = useRef<Floor[][]>([]);
  const lastRecord = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const [canUndo, setCanUndo] = useState(false);
  /** Guarda el estado actual antes de un cambio. Los cambios seguidos del mismo campo cuentan como uno. */
  function remember(key?: string) {
    const now = Date.now();
    if (key && lastRecord.current.key === key && now - lastRecord.current.at < 1500) {
      lastRecord.current.at = now;
      return;
    }
    lastRecord.current = { key: key ?? "", at: now };
    history.current = [...history.current.slice(-49), floors];
    setCanUndo(true);
  }
  function undo() {
    const prev = history.current.pop();
    setCanUndo(history.current.length > 0);
    lastRecord.current = { key: "", at: 0 };
    if (prev) {
      onChange(prev);
      setFloorIdx((i) => Math.min(i, prev.length - 1));
    }
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const dragState = useRef<{
    id: string;
    kind: "move" | "se" | "e" | "s";
    startMouse: { x: number; y: number };
    startRoom: Room;
  } | null>(null);

  const M = 70;
  const B = 150;
  const vbW = floor.width * UNITS + M * 2;
  const vbH = floor.height * UNITS + M + B;
  const { ref, k } = useUnitsPerPixel(vbW);

  // En la computadora siempre hay uno elegido; en el teléfono se pueden cerrar todos.
  const selected =
    floor.rooms.find((r) => r.id === selectedId) ?? (compact ? null : (floor.rooms[0] ?? null));

  const collidingIds = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < floor.rooms.length; i++) {
      for (let j = i + 1; j < floor.rooms.length; j++) {
        if (overlaps(floor.rooms[i], floor.rooms[j])) {
          set.add(floor.rooms[i].id);
          set.add(floor.rooms[j].id);
        }
      }
    }
    return set;
  }, [floor.rooms]);

  /** `record`: false durante un arrastre (se guarda una sola vez, al empezar); un texto agrupa cambios seguidos. */
  function updateFloor(patch: Partial<Floor>, record: boolean | string = true) {
    if (record) remember(typeof record === "string" ? record : undefined);
    onChange(floors.map((f, i) => (i === floorIdx ? { ...f, ...patch } : f)));
  }

  function updateRoom(id: string, patch: Partial<Room>, record: boolean | string = true) {
    updateFloor({ rooms: floor.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }, record);
  }

  /** Lugar para una pieza nueva: el primer hueco libre o, si no hay, debajo (el terreno crece). */
  function placeFor(w: number, h: number, ignoreId?: string) {
    const slot = findSlot(floor, w, h, ignoreId);
    if (slot) return { ...slot, height: floor.height, width: floor.width };
    const bottom = Math.max(0, ...floor.rooms.filter((r) => r.id !== ignoreId).map((r) => r.y + r.h));
    return { x: 0, y: bottom, height: Math.max(floor.height, bottom + h), width: Math.max(floor.width, w) };
  }

  /** Medida de la planta tal como se escribió; los cuartos que se salen se acomodan adentro. */
  function setFloorSize(patch: { width?: number; height?: number }) {
    const width = patch.width ?? floor.width;
    const height = patch.height ?? floor.height;
    let moved = false;
    const rooms = floor.rooms.map((r) => {
      const w = Math.min(r.w, width);
      const h = Math.min(r.h, height);
      const x = Math.min(r.x, Math.max(0, width - w));
      const y = Math.min(r.y, Math.max(0, height - h));
      if (w !== r.w || h !== r.h || x !== r.x || y !== r.y) moved = true;
      return { ...r, w, h, x, y };
    });
    updateFloor({ width, height, rooms });
    if (moved) toast("Acomodamos dentro de la planta los espacios que quedaban afuera.");
  }

  /** Medida de un cuarto tal como se escribió; si no cabe, la planta crece para contenerlo. */
  function setRoomSize(id: string, patch: { w?: number; h?: number }) {
    const r = floor.rooms.find((x) => x.id === id);
    if (!r) return;
    let next = { ...r, ...patch };
    let width = Math.max(floor.width, next.x + next.w);
    let height = Math.max(floor.height, next.y + next.h);
    // Las piezas no se enciman: si con la medida nueva choca con otra, se lleva a un hueco libre.
    const bigger = { ...floor, width, height };
    if (floor.rooms.some((o) => o.id !== id && overlaps(next, o))) {
      const slot = findSlot(bigger, next.w, next.h, id);
      if (slot) next = { ...next, ...slot };
      else {
        const bottom = Math.max(0, ...floor.rooms.filter((o) => o.id !== id).map((o) => o.y + o.h));
        next = { ...next, x: 0, y: bottom };
        height = Math.max(height, bottom + next.h);
        width = Math.max(width, next.w);
      }
      toast(`«${next.name}» ya no cabía ahí: lo pusimos en un espacio libre. Deslízalo a su lugar.`);
    }
    updateFloor({ width, height, rooms: floor.rooms.map((x) => (x.id === id ? next : x)) });
    if (width !== floor.width || height !== floor.height) {
      toast(`El terreno creció a ${String(width).replace(".", ",")} × ${String(height).replace(".", ",")} m para que quepa.`);
    }
  }

  function addRoom(type: RoomType, at?: { x: number; y: number }) {
    const meta = ROOM_TYPES[type];
    const w = Math.min(meta.w, floor.width);
    const h = Math.min(meta.h, floor.height);
    const sameCount = floor.rooms.filter((r) => r.type === type).length;
    const name = sameCount === 0 ? meta.label : `${meta.label} ${sameCount + 1}`;
    // Donde se soltó, si está libre; si no, en el primer hueco libre (o debajo, y el terreno crece).
    const dropped = at && {
      x: clamp(snap(at.x - w / 2), 0, floor.width - w),
      y: clamp(snap(at.y - h / 2), 0, floor.height - h),
    };
    const droppedFree =
      dropped && !floor.rooms.some((o) => overlaps({ id: "_", type, name: "", ...dropped, w, h, photos: [] }, o));
    const place = droppedFree ? { ...dropped, width: floor.width, height: floor.height } : placeFor(w, h);
    const pos = { x: place.x, y: place.y };
    const room: Room = {
      id: `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      type,
      name,
      x: pos.x,
      y: pos.y,
      w,
      h,
      photos: [],
      features: meta.features.slice(0, 2),
      view: undefined,
    };
    updateFloor({ rooms: [...floor.rooms, room], width: place.width, height: place.height });
    setSelectedId(room.id);
  }

  function duplicateRoom(r: Room) {
    const pos = placeFor(r.w, r.h);
    const copy: Room = {
      ...r,
      id: `u${Date.now().toString(36)}`,
      name: `${r.name} (copia)`,
      x: pos.x,
      y: pos.y,
    };
    updateFloor({ rooms: [...floor.rooms, copy], width: pos.width, height: pos.height });
    setSelectedId(copy.id);
  }

  function removeRoom(id: string) {
    const next = floor.rooms.filter((r) => r.id !== id);
    updateFloor({ rooms: next });
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
  }

  function addFloor() {
    const idx = floors.length + 1;
    const nf: Floor = {
      id: `pl-${idx}`,
      name: idx === 2 ? "Planta alta" : `Planta ${idx}`,
      width: floor.width,
      height: floor.height,
      rooms: [
        {
          id: `u${Date.now().toString(36)}`,
          type: "dormitorio",
          name: "Dormitorio",
          x: 0,
          y: 0,
          w: 4,
          h: 3.5,
          // Sin fotos ni detalles de muestra: todo lo pone quien publica.
          photos: [],
          features: [],
        },
      ],
    };
    remember();
    onChange([...floors, nf]);
    setFloorIdx(floors.length);
    setSelectedId(nf.rooms[0].id);
  }

  function startDrag(e: PointerEvent, room: Room, kind: "move" | "se" | "e" | "s") {
    e.stopPropagation();
    if (!svgRef.current) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    remember();
    dragState.current = {
      id: room.id,
      kind,
      startMouse: { x: p.x / UNITS, y: p.y / UNITS },
      startRoom: { ...room },
    };
    setSelectedId(room.id);
  }

  function onPointerMove(e: PointerEvent) {
    const st = dragState.current;
    if (!st || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    const dx = p.x / UNITS - st.startMouse.x;
    const dy = p.y / UNITS - st.startMouse.y;
    const r = st.startRoom;
    const live = floor.rooms.find((x) => x.id === st.id);
    if (!live) return;
    if (st.kind === "move") {
      const to = slideRoom(floor, live, snap(r.x + dx), snap(r.y + dy));
      if (to.x !== live.x || to.y !== live.y) updateRoom(st.id, to, false);
    } else {
      // Agrandar también se detiene al topar con otra pieza.
      const tw = st.kind === "s" ? r.w : clamp(snap(r.w + dx), 1, floor.width - r.x);
      const th = st.kind === "e" ? r.h : clamp(snap(r.h + dy), 1, floor.height - r.y);
      const fits = (w: number, h: number) =>
        !floor.rooms.some((o) => o.id !== live.id && overlaps({ ...live, w, h }, o));
      let w = live.w;
      let h = live.h;
      while (Math.abs(tw - w) >= SNAP / 2 && fits(w + Math.sign(tw - w) * SNAP, h)) w += Math.sign(tw - w) * SNAP;
      while (Math.abs(th - h) >= SNAP / 2 && fits(w, h + Math.sign(th - h) * SNAP)) h += Math.sign(th - h) * SNAP;
      if (w !== live.w || h !== live.h) updateRoom(st.id, { w, h }, false);
    }
  }

  function endDrag() {
    dragState.current = null;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/room-type") as RoomType;
    if (!type || !ROOM_TYPES[type] || !svgRef.current) return;
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
    addRoom(type, { x: p.x / UNITS, y: p.y / UNITS });
  }

  function onRoomKey(e: KeyboardEvent, room: Room) {
    const step = 0.5;
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeRoom(room.id);
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const dx = e.key === "ArrowRight" ? step : e.key === "ArrowLeft" ? -step : 0;
    const dy = e.key === "ArrowDown" ? step : e.key === "ArrowUp" ? -step : 0;
    if (e.shiftKey) {
      updateRoom(room.id, {
        w: clamp(room.w + dx, 1, floor.width - room.x),
        h: clamp(room.h + dy, 1, floor.height - room.y),
      });
    } else {
      updateRoom(room.id, slideRoom(floor, room, room.x + dx, room.y + dy), `mover:${room.id}`);
    }
  }

  /** Mover el espacio medio metro (flechas del teléfono, en lugar de arrastrar). */
  function nudge(room: Room, dx: number, dy: number) {
    const to = slideRoom(floor, room, room.x + dx, room.y + dy);
    if (to.x === room.x && to.y === room.y) toast("Ahí topa con otra pieza o con el borde del terreno.");
    else updateRoom(room.id, to, `mover:${room.id}`);
  }

  async function onFiles(files: FileList | null) {
    if (!files || !selected) return;
    const room = selected;
    const urls: string[] = [];
    for (const file of Array.from(files).slice(0, 6)) {
      try {
        urls.push(await uploadPhoto(file));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo subir la foto.");
        break;
      }
    }
    if (urls.length) updateRoom(room.id, { photos: [...room.photos, ...urls].slice(0, 12) });
  }

  const totalArea = floor.rooms.reduce(
    (s, r) => s + (ROOM_TYPES[r.type].outdoor ? 0 : roomArea(r)),
    0,
  );
  const outdoorArea = floor.rooms.reduce(
    (s, r) => s + (ROOM_TYPES[r.type].outdoor ? roomArea(r) : 0),
    0,
  );
  const missingPhotos = floor.rooms.filter((r) => r.photos.length === 0);

  const roomEditor = selected ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="label text-terracota-700">Espacio seleccionado</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => duplicateRoom(selected)}
                    title="Duplicar espacio"
                    className="inline-flex size-8 items-center justify-center rounded-ctl text-grafito-700 hover:bg-arena-200"
                  >
                    <Copy className="size-4" />
                  </button>
                  {floor.rooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRoom(selected.id)}
                      title="Eliminar espacio"
                      className="inline-flex size-8 items-center justify-center rounded-ctl text-error hover:bg-error-bg"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              <label className="mt-3 block">
                <span className="label-sm text-grafito-600">Nombre</span>
                <input
                  type="text"
                  value={selected.name}
                  onChange={(e) => updateRoom(selected.id, { name: e.target.value }, `nombre:${selected.id}`)}
                  className="mt-1 h-10 w-full rounded-ctl bg-crema-100 px-3 text-[15px] font-semibold ring-1 ring-piedra-250 outline-none focus:ring-negro"
                />
              </label>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="label-sm text-grafito-600">Ancho (m)</span>
                  <MetresField
                    value={selected.w}
                    onCommit={(v) => setRoomSize(selected.id, { w: v })}
                    className="mt-1 h-10 w-full rounded-ctl bg-crema-100 px-2.5 text-[14px] font-semibold tabular-nums ring-1 ring-piedra-250"
                  />
                </label>
                <label className="block">
                  <span className="label-sm text-grafito-600">Largo (m)</span>
                  <MetresField
                    value={selected.h}
                    onCommit={(v) => setRoomSize(selected.id, { h: v })}
                    className="mt-1 h-10 w-full rounded-ctl bg-crema-100 px-2.5 text-[14px] font-semibold tabular-nums ring-1 ring-piedra-250"
                  />
                </label>
                <div>
                  <span className="label-sm text-grafito-600">Área</span>
                  <p className="mt-1 flex h-10 items-center rounded-ctl bg-arena-200 px-2.5 text-[14px] font-semibold tabular-nums">
                    {m2(roomArea(selected))}
                  </p>
                </div>
              </div>

              {compact && floor.rooms.length > 1 && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-ctl bg-crema-100 px-3 py-2.5 ring-1 ring-arena-200">
                  <span className="text-[14px] text-grafito-700">Moverlo en el plano</span>
                  <div className="flex items-center gap-1.5">
                    {(
                      [
                        [ArrowLeft, -SNAP, 0, "a la izquierda"],
                        [ArrowUp, 0, -SNAP, "hacia arriba"],
                        [ArrowDown, 0, SNAP, "hacia abajo"],
                        [ArrowRight, SNAP, 0, "a la derecha"],
                      ] as const
                    ).map(([Icon, dx, dy, label]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => nudge(selected, dx, dy)}
                        aria-label={`Mover ${label}`}
                        className="inline-flex size-10 items-center justify-center rounded-ctl bg-crema-050 text-negro ring-1 ring-piedra-250 active:bg-arena-200"
                      >
                        <Icon className="size-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos of this room */}
              <div className="mt-5 border-t border-arena-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="label-sm text-grafito-600">
                    Fotos de este espacio ({selected.photos.length})
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-1 text-[14px] font-semibold text-terracota-700 underline underline-offset-4">
                    <ImagePlus className="size-3.5" /> Subir foto
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onFiles(e.target.files)}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {selected.photos.map((p, i) => (
                    <div
                      key={`${p}-${i}`}
                      className="group relative aspect-[4/3] overflow-hidden rounded-[3px] bg-arena-200"
                    >
                      <img src={photoUrl(p, 240, 180)} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          updateRoom(selected.id, {
                            photos: selected.photos.filter((_, idx) => idx !== i),
                          })
                        }
                        aria-label="Quitar foto"
                        className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-negro/80 text-crema-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* View (for terraces, balconies, bedrooms, etc.) */}
              {ROOM_TYPES[selected.type].view && (
                <div className="mt-5 border-t border-arena-200 pt-4">
                  <span className="label-sm text-grafito-600">¿Tiene vista?</span>
                  <select
                    value={selected.view?.label ?? ""}
                    onChange={(e) => {
                      const label = e.target.value;
                      updateRoom(selected.id, {
                        view: label
                          ? { label, photo: selected.view?.photo }
                          : undefined,
                      });
                    }}
                    className="mt-1.5 h-10 w-full rounded-ctl bg-crema-100 px-3 text-[14px] font-medium ring-1 ring-piedra-250"
                  >
                    <option value="">Sin vista destacada</option>
                    {VIEW_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                  {selected.view && (
                    <label className="mt-2 inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-[14px] font-medium text-terracota-700 underline underline-offset-4">
                      {selected.view.photo ? "Cambiar foto de la vista" : "Subir foto de la vista"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file || !selected.view) return;
                          const room = selected;
                          try {
                            const url = await uploadPhoto(file);
                            updateRoom(room.id, { view: { label: room.view!.label, photo: url } });
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "No se pudo subir la foto.");
                          }
                        }}
                      />
                    </label>
                  )}
                  {selected.view?.photo && (
                    <div className="mt-2 flex items-center gap-2.5 rounded-ctl bg-arena-200 p-2">
                      <img
                        src={photoUrl(selected.view.photo, 160, 110)}
                        alt=""
                        className="h-11 w-16 rounded-[2px] object-cover"
                      />
                      <span className="text-[14px] text-grafito-700">
                        Foto de la vista: {selected.view.label.toLowerCase()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Features */}
              <div className="mt-5 border-t border-arena-200 pt-4">
                <span className="label-sm text-grafito-600">Qué tiene este espacio</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ROOM_TYPES[selected.type].features.map((feat) => {
                    const has = selected.features?.includes(feat) ?? false;
                    return (
                      <button
                        key={feat}
                        type="button"
                        aria-pressed={has}
                        onClick={() => {
                          const list = selected.features ?? [];
                          updateRoom(selected.id, {
                            features: has ? list.filter((x) => x !== feat) : [...list, feat],
                          });
                        }}
                        className={cx(
                          "rounded-[3px] px-2.5 py-1 text-[14px] font-medium",
                          has
                            ? "bg-negro text-crema-100"
                            : "bg-arena-200 text-grafito-700 hover:text-negro",
                        )}
                      >
                        {feat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="mt-4 block">
                <span className="label-sm text-grafito-600">
                  Nota sobre este espacio (opcional)
                </span>
                <input
                  type="text"
                  value={selected.note ?? ""}
                  onChange={(e) => updateRoom(selected.id, { note: e.target.value || undefined }, `nota:${selected.id}`)}
                  placeholder="Ej.: cabe una cama queen o un escritorio…"
                  className="mt-1 h-9 w-full rounded-ctl bg-crema-100 px-3 text-[14px] ring-1 ring-piedra-250 outline-none focus:ring-negro"
                />
              </label>
            </div>
  ) : null;

  const palette = (
        <div className="rounded-card bg-crema-050 p-4 ring-1 ring-arena-200">
          <p className="label text-grafito-600">Añadir espacio</p>
          <p className="mt-1 text-[14px] text-grafito-600">
            Arrástralo al plano o tócalo para añadirlo.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-2">
            {ROOM_ORDER.map((type) => {
              const meta = ROOM_TYPES[type];
              return (
                <button
                  key={type}
                  type="button"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/room-type", type)}
                  onClick={() => addRoom(type)}
                  className={cx(
                    "flex flex-col items-start rounded-ctl p-2.5 text-left text-[14px] ring-1 ring-piedra-250 transition-colors hover:bg-arena-200 hover:ring-negro",
                    meta.outdoor ? "hatch bg-crema-100" : "bg-crema-100",
                  )}
                >
                  <span className="font-semibold text-negro">{meta.label}</span>
                  <span className="mono mt-0.5 text-[14px] text-grafito-600">
                    {dec(meta.w)} × {dec(meta.h)} m
                  </span>
                </button>
              );
            })}
          </div>
        </div>
  );

  const canvas = (
        <div className="min-w-0">
          <div
            ref={ref}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="rounded-card bg-crema-050 p-3 ring-1 ring-arena-200 sm:p-5"
          >
            <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
              <svg
                ref={svgRef}
                viewBox={`${-M} ${-M} ${vbW} ${vbH}`}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                className={cx(
                  "block h-auto w-full select-none",
                  // En la computadora se arrastra; en el teléfono la página debe poder desplazarse.
                  !compact && "min-w-[540px] touch-none",
                  compact && arranging && "touch-none",
                )}
                role="application"
                aria-label="Editor del plano. Usa las flechas para mover el espacio seleccionado y Shift más flechas para cambiar su tamaño."
              >
                <PlanDefs uid={uid} k={k} />
                <MetreGrid width={floor.width} height={floor.height} />

                {floor.rooms.map((room) => {
                  const meta = ROOM_TYPES[room.type];
                  const active = room.id === selected?.id;
                  const colliding = collidingIds.has(room.id);
                  const x = room.x * UNITS;
                  const y = room.y * UNITS;
                  const w = room.w * UNITS;
                  const h = room.h * UNITS;
                  const a = roomArea(room);
                  const fill = active
                    ? meta.outdoor
                      ? `url(#hatch-dark-${uid})`
                      : "#0A0A0A"
                    : meta.outdoor
                      ? `url(#hatch-${uid})`
                      : "#FBF9F5";
                  const text = active ? "#F5F2EB" : "#0A0A0A";
                  // En el teléfono, letras un poco más grandes: el plano se ve más chico.
                  const fsName = (compact ? 12 : 10) * k;
                  const fsArea = (compact ? 14 : 12.5) * k;
                  const handle = 8.5 * k;

                  return (
                    <g
                      key={room.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${room.name}, ${dec(room.w)} por ${dec(room.h)} metros`}
                      onKeyDown={(e) => onRoomKey(e, room)}
                      onPointerDown={compact && !arranging ? undefined : (e) => startDrag(e, room, "move")}
                      onClick={compact && !arranging ? () => setSelectedId(room.id) : undefined}
                      style={{ cursor: compact && !arranging ? "pointer" : "grab" }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill={fill}
                        stroke={colliding ? "#9E1B12" : "#0A0A0A"}
                        strokeWidth={active || colliding ? 2.2 : 1.5}
                        strokeDasharray={meta.outdoor && !active ? "5 3" : undefined}
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        x={x + w / 2}
                        y={y + h / 2 - fsArea * 0.25}
                        textAnchor="middle"
                        fontFamily={MONO}
                        fontSize={fsName}
                        fontWeight={500}
                        letterSpacing={fsName * 0.08}
                        fill={text}
                        style={{ pointerEvents: "none" }}
                      >
                        {compact
                          ? fitLabel(room.name.toUpperCase(), w - 12 * k, fsName, room.type)
                          : room.name.toUpperCase()}
                      </text>
                      <text
                        x={x + w / 2}
                        y={y + h / 2 + fsArea * 0.95}
                        textAnchor="middle"
                        fontFamily={SANS}
                        fontSize={fsArea}
                        fontWeight={600}
                        fill={text}
                        style={{ pointerEvents: "none" }}
                      >
                        {compact ? `${dec(a, 1)} m²` : `${dec(room.w)} × ${dec(room.h)} m · ${dec(a, 1)} m²`}
                      </text>

                      {active && !compact && (
                        <>
                          {/* East resize handle */}
                          <rect
                            x={x + w - handle / 2}
                            y={y + h / 2 - handle}
                            width={handle}
                            height={handle * 2}
                            fill="#F5F2EB"
                            stroke="#0A0A0A"
                            strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke"
                            style={{ cursor: "ew-resize" }}
                            onPointerDown={(e) => startDrag(e, room, "e")}
                          />
                          {/* South resize handle */}
                          <rect
                            x={x + w / 2 - handle}
                            y={y + h - handle / 2}
                            width={handle * 2}
                            height={handle}
                            fill="#F5F2EB"
                            stroke="#0A0A0A"
                            strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke"
                            style={{ cursor: "ns-resize" }}
                          />
                          {/* South-East corner handle */}
                          <rect
                            x={x + w - handle * 0.7}
                            y={y + h - handle * 0.7}
                            width={handle * 1.4}
                            height={handle * 1.4}
                            fill="#D4541A"
                            stroke="#0A0A0A"
                            strokeWidth={1.5}
                            vectorEffect="non-scaling-stroke"
                            style={{ cursor: "nwse-resize" }}
                            onPointerDown={(e) => startDrag(e, room, "se")}
                          />
                        </>
                      )}
                    </g>
                  );
                })}

                {selected && !compact && <RoomDimensions room={selected} k={k} floor={floor} />}
                <ScaleBar
                  x={0}
                  y={floor.height * UNITS + 60}
                  k={k}
                  metres={floor.width >= 14 ? 5 : 3}
                />
                <NorthArrow x={floor.width * UNITS - 12 * k} y={floor.height * UNITS + 78} k={k} />
              </svg>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[14px] text-grafito-600">
            <span>
              {floor.rooms.length} espacios ·{" "}
              <strong className="font-semibold text-negro">{m2(Math.round(totalArea))}</strong>{" "}
              interiores
              {outdoorArea > 0 && ` · ${m2(Math.round(outdoorArea))} exteriores`}
            </span>
            {collidingIds.size > 0 ? (
              <span className="font-medium text-error">
                Hay espacios encimados: muévelos para que no se crucen.
              </span>
            ) : missingPhotos.length > 0 ? (
              <span className="font-medium text-aviso">
                {compact
                  ? `Faltan fotos en ${missingPhotos.length} ${missingPhotos.length === 1 ? "espacio" : "espacios"}.`
                  : `Falta subir fotos en ${missingPhotos.map((r) => r.name.toLowerCase()).join(", ")}.`}
              </span>
            ) : (
              <span className="font-medium text-exito">
                Todos los espacios tienen medidas y fotos.
              </span>
            )}
          </div>
        </div>
  );

  if (mode === "inquilino") {
    return (
      <div>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card bg-negro px-5 py-4 text-crema-100">
          <div>
            <p className="label text-terracota-300">Vista del inquilino</p>
            <p className="mt-0.5 text-[14px]">
              Así se ve tu plano publicado. Toca cualquier espacio para probar sus fotos.
            </p>
          </div>
          <Button variant="cream" size="sm" onClick={() => setMode("editar")}>
            Volver a editar el plano
          </Button>
        </div>
        <PlanExplorer floors={floors} context={title || "Tu casa"} />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-4">
        {/* Planta y su tamaño */}
        <div className="space-y-3 rounded-card bg-crema-050 p-3.5 ring-1 ring-arena-200">
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 no-scrollbar">
            {floors.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFloorIdx(i);
                  setSelectedId(f.rooms[0]?.id ?? null);
                }}
                className={cx(
                  "h-10 shrink-0 rounded-ctl px-3.5 text-[14px] font-medium",
                  i === floorIdx ? "bg-negro text-crema-100" : "bg-arena-200 text-grafito-700",
                )}
              >
                {f.name}
              </button>
            ))}
            {floors.length < 3 && (
              <button
                type="button"
                onClick={addFloor}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-ctl px-3 text-[14px] font-medium text-grafito-700 ring-1 ring-piedra-250"
              >
                <Plus className="size-3.5" /> Otra planta
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 text-[14px] text-grafito-700">
            <span className="mr-auto">Tamaño total</span>
            <MetresField
              value={floor.width}
              onCommit={(v) => setFloorSize({ width: v })}
              ariaLabel="Ancho de la planta en metros"
              className="h-10 w-16 rounded-ctl bg-crema-100 px-2 text-center text-[15px] font-semibold tabular-nums text-negro ring-1 ring-piedra-250"
            />
            <span>×</span>
            <MetresField
              value={floor.height}
              onCommit={(v) => setFloorSize({ height: v })}
              ariaLabel="Fondo de la planta en metros"
              className="h-10 w-16 rounded-ctl bg-crema-100 px-2 text-center text-[15px] font-semibold tabular-nums text-negro ring-1 ring-piedra-250"
            />
            <span>m</span>
          </div>
        </div>

        {/* Acomodar: como un rompecabezas, las piezas se deslizan sin encimarse. */}
        <div className="flex items-center gap-2">
          <Button
            variant={arranging ? "ink" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setArranging((v) => !v)}
            aria-pressed={arranging}
          >
            {arranging ? <Check className="size-4" /> : <Move className="size-4" />}
            {arranging ? "Listo" : "Acomodar piezas"}
          </Button>
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="inline-flex h-10 items-center gap-1.5 rounded-ctl px-3 text-[14px] font-medium text-negro ring-1 ring-piedra-250 disabled:opacity-40"
          >
            <Undo2 className="size-4" /> Deshacer
          </button>
        </div>
        {arranging && (
          <p className="-mt-2 rounded-ctl bg-crema-100 px-3 py-2 text-[14px] text-grafito-700 ring-1 ring-arena-200">
            Desliza cada cuarto con el dedo hasta su lugar. Se detiene al topar con otro o con el borde: nunca se
            enciman. Toca «Listo» para volver a desplazarte por la página.
          </p>
        )}

        {canvas}

        {/* Añadir */}
        <div>
          <Button
            variant={adding ? "ink" : "primary"}
            className="w-full"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
          >
            {adding ? <X className="size-4" /> : <Plus className="size-4" />}
            {adding ? "Cerrar" : "Añadir espacio"}
          </Button>
          {adding && (
            <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-card bg-crema-050 p-2 ring-1 ring-arena-200">
              {ROOM_ORDER.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    addRoom(type);
                    setAdding(false);
                  }}
                  className={cx(
                    "h-11 rounded-ctl px-1.5 text-[14px] font-medium text-negro ring-1 ring-piedra-250 active:bg-arena-200",
                    ROOM_TYPES[type].outdoor ? "hatch bg-crema-100" : "bg-crema-100",
                  )}
                >
                  {ROOM_TYPES[type].label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de espacios: se toca uno para ponerle medidas y fotos */}
        <div>
          <p className="mb-2 text-[14px] text-grafito-600">
            Toca un espacio (aquí o en el plano) para poner sus medidas y fotos.
          </p>
          <ul className="space-y-2">
            {floor.rooms.map((r) => {
              const open = r.id === selected?.id;
              return (
                <li
                  key={r.id}
                  id={`espacio-${r.id}`}
                  className={cx(
                    "scroll-mt-24 overflow-hidden rounded-card bg-crema-050 ring-1",
                    open ? "ring-negro" : "ring-arena-200",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(open ? null : r.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold text-negro">{r.name}</span>
                      <span className="block text-[14px] tabular-nums text-grafito-600">
                        {dec(r.w)} × {dec(r.h)} m · {dec(roomArea(r), 1)} m²
                      </span>
                    </span>
                    <span
                      className={cx(
                        "shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium",
                        r.photos.length ? "bg-exito-bg text-exito" : "bg-aviso-bg text-aviso",
                      )}
                    >
                      {r.photos.length ? `${r.photos.length} foto${r.photos.length === 1 ? "" : "s"}` : "Sin fotos"}
                    </span>
                    <ChevronDown className={cx("size-5 shrink-0 text-grafito-600 transition-transform", open && "rotate-180")} />
                  </button>
                  {open && roomEditor && (
                    <div className="border-t border-arena-200 px-4 pb-4 pt-3">{roomEditor}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {onReset && (
            <button
              type="button"
              onClick={() => {
                remember();
                onReset();
              }}
              className="inline-flex items-center gap-1 text-[14px] text-grafito-600"
            >
              <RotateCcw className="size-3.5" /> Empezar de nuevo
            </button>
          )}
          <Button variant="outline" size="sm" onClick={() => setMode("inquilino")}>
            <Eye className="size-3.5" /> Ver como inquilino
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card bg-crema-050 p-3.5 ring-1 ring-arena-200 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          {floors.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFloorIdx(i);
                setSelectedId(f.rooms[0]?.id ?? null);
              }}
              className={cx(
                "h-9 rounded-ctl px-3.5 text-[14px] font-medium",
                i === floorIdx
                  ? "bg-negro text-crema-100"
                  : "bg-arena-200 text-grafito-700 hover:text-negro",
              )}
            >
              {f.name}
            </button>
          ))}
          {floors.length < 3 && (
            <button
              type="button"
              onClick={addFloor}
              className="inline-flex h-9 items-center gap-1 rounded-ctl px-3 text-[14px] font-medium text-grafito-700 ring-1 ring-piedra-250 hover:bg-arena-200"
            >
              <Plus className="size-3.5" /> Añadir planta
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[14px]">
          <label className="inline-flex items-center gap-1.5 text-grafito-700">
            <span>Ancho:</span>
            <MetresField
              value={floor.width}
              onCommit={(v) => setFloorSize({ width: v })}
              className="h-8 w-14 rounded-ctl bg-crema-100 px-2 text-center font-semibold tabular-nums text-negro ring-1 ring-piedra-250"
            />
            <span>m</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-grafito-700">
            <span>Fondo:</span>
            <MetresField
              value={floor.height}
              onCommit={(v) => setFloorSize({ height: v })}
              className="h-8 w-14 rounded-ctl bg-crema-100 px-2 text-center font-semibold tabular-nums text-negro ring-1 ring-piedra-250"
            />
            <span>m</span>
          </label>
          {onReset && (
            <button
              type="button"
              onClick={() => {
                remember();
                onReset();
              }}
              className="inline-flex items-center gap-1 text-grafito-600 hover:text-negro"
              title="Volver al plano de ejemplo"
            >
              <RotateCcw className="size-3.5" /> Restablecer
            </button>
          )}
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="inline-flex h-9 items-center gap-1.5 rounded-ctl px-3 text-[14px] font-medium text-negro ring-1 ring-piedra-250 disabled:opacity-40"
          >
            <Undo2 className="size-4" /> Deshacer
          </button>
          <Button variant="ink" size="sm" onClick={() => setMode("inquilino")}>
            <Eye className="size-3.5" /> Probar como inquilino
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr_340px]">
        {palette}
        {canvas}
        {/* ——— ROOM INSPECTOR ——— */}
        <div className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
          {roomEditor ?? (
            <p className="text-[14px] text-grafito-600">
              Toca un espacio del plano para editar sus metros y subir sus fotos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export { Segmented };
