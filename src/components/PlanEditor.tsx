"use client";

import { toast } from "sonner";
import { uploadPhoto } from "../lib/upload";
import { Copy, Eye, ImagePlus, Plus, RotateCcw, Trash2, X } from "lucide-react";
import {
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

function findSlot(floor: Floor, w: number, h: number) {
  for (let y = 0; y <= floor.height - h; y += 0.5) {
    for (let x = 0; x <= floor.width - w; x += 0.5) {
      const probe: Room = { id: "_", type: "sala", name: "", x, y, w, h, photos: [] };
      if (!floor.rooms.some((r) => overlaps(probe, r))) return { x, y };
    }
  }
  return { x: 0.5, y: 0.5 };
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

  const selected = floor.rooms.find((r) => r.id === selectedId) ?? floor.rooms[0] ?? null;

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

  function updateFloor(patch: Partial<Floor>) {
    onChange(floors.map((f, i) => (i === floorIdx ? { ...f, ...patch } : f)));
  }

  function updateRoom(id: string, patch: Partial<Room>) {
    updateFloor({ rooms: floor.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  }

  function addRoom(type: RoomType, at?: { x: number; y: number }) {
    const meta = ROOM_TYPES[type];
    const w = Math.min(meta.w, floor.width);
    const h = Math.min(meta.h, floor.height);
    const sameCount = floor.rooms.filter((r) => r.type === type).length;
    const name = sameCount === 0 ? meta.label : `${meta.label} ${sameCount + 1}`;
    const pos = at
      ? {
          x: clamp(snap(at.x - w / 2), 0, floor.width - w),
          y: clamp(snap(at.y - h / 2), 0, floor.height - h),
        }
      : findSlot(floor, w, h);
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
    updateFloor({ rooms: [...floor.rooms, room] });
    setSelectedId(room.id);
  }

  function duplicateRoom(r: Room) {
    const pos = findSlot(floor, r.w, r.h);
    const copy: Room = {
      ...r,
      id: `u${Date.now().toString(36)}`,
      name: `${r.name} (copia)`,
      x: pos.x,
      y: pos.y,
    };
    updateFloor({ rooms: [...floor.rooms, copy] });
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
          photos: ["dormMinimal", "camaRayas"],
          features: ["Cama queen", "Clóset"],
        },
      ],
    };
    onChange([...floors, nf]);
    setFloorIdx(floors.length);
    setSelectedId(nf.rooms[0].id);
  }

  function startDrag(e: PointerEvent, room: Room, kind: "move" | "se" | "e" | "s") {
    e.stopPropagation();
    if (!svgRef.current) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const p = svgPoint(svgRef.current, e.clientX, e.clientY);
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
    if (st.kind === "move") {
      updateRoom(st.id, {
        x: clamp(snap(r.x + dx), 0, floor.width - r.w),
        y: clamp(snap(r.y + dy), 0, floor.height - r.h),
      });
    } else {
      const w = st.kind === "s" ? r.w : clamp(snap(r.w + dx), 1, floor.width - r.x);
      const h = st.kind === "e" ? r.h : clamp(snap(r.h + dy), 1, floor.height - r.y);
      updateRoom(st.id, { w, h });
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
      updateRoom(room.id, {
        x: clamp(room.x + dx, 0, floor.width - room.w),
        y: clamp(room.y + dy, 0, floor.height - room.h),
      });
    }
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
            <input
              type="number"
              min={6}
              max={28}
              step={0.5}
              value={floor.width}
              onChange={(e) => updateFloor({ width: clamp(Number(e.target.value) || 12, 6, 28) })}
              className="h-8 w-14 rounded-ctl bg-crema-100 px-2 text-center font-semibold tabular-nums text-negro ring-1 ring-piedra-250"
            />
            <span>m</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-grafito-700">
            <span>Fondo:</span>
            <input
              type="number"
              min={6}
              max={24}
              step={0.5}
              value={floor.height}
              onChange={(e) => updateFloor({ height: clamp(Number(e.target.value) || 10, 6, 24) })}
              className="h-8 w-14 rounded-ctl bg-crema-100 px-2 text-center font-semibold tabular-nums text-negro ring-1 ring-piedra-250"
            />
            <span>m</span>
          </label>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-grafito-600 hover:text-negro"
              title="Volver al plano de ejemplo"
            >
              <RotateCcw className="size-3.5" /> Restablecer
            </button>
          )}
          <Button variant="ink" size="sm" onClick={() => setMode("inquilino")}>
            <Eye className="size-3.5" /> Probar como inquilino
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[220px_1fr_340px]">
        {/* ——— PALETTE ——— */}
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

        {/* ——— CANVAS ——— */}
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
                className="block h-auto min-w-[540px] w-full select-none touch-none"
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
                  const fsName = 10 * k;
                  const fsArea = 12.5 * k;
                  const handle = 8.5 * k;

                  return (
                    <g
                      key={room.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${room.name}, ${dec(room.w)} por ${dec(room.h)} metros`}
                      onKeyDown={(e) => onRoomKey(e, room)}
                      onPointerDown={(e) => startDrag(e, room, "move")}
                      style={{ cursor: "grab" }}
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
                        {room.name.toUpperCase()}
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
                        {dec(room.w)} × {dec(room.h)} m · {dec(a, 1)} m²
                      </text>

                      {active && (
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

                {selected && <RoomDimensions room={selected} k={k} floor={floor} />}
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
                Falta subir fotos en {missingPhotos.map((r) => r.name.toLowerCase()).join(", ")}.
              </span>
            ) : (
              <span className="font-medium text-exito">
                Todos los espacios tienen medidas y fotos.
              </span>
            )}
          </div>
        </div>

        {/* ——— ROOM INSPECTOR ——— */}
        <div className="rounded-card bg-crema-050 p-5 ring-1 ring-arena-200">
          {selected ? (
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
                  onChange={(e) => updateRoom(selected.id, { name: e.target.value })}
                  className="mt-1 h-10 w-full rounded-ctl bg-crema-100 px-3 text-[15px] font-semibold ring-1 ring-piedra-250 outline-none focus:ring-negro"
                />
              </label>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="label-sm text-grafito-600">Ancho (m)</span>
                  <input
                    type="number"
                    min={1}
                    max={floor.width}
                    step={0.5}
                    value={selected.w}
                    onChange={(e) =>
                      updateRoom(selected.id, {
                        w: clamp(Number(e.target.value) || 1, 1, floor.width - selected.x),
                      })
                    }
                    className="mt-1 h-10 w-full rounded-ctl bg-crema-100 px-2.5 text-[14px] font-semibold tabular-nums ring-1 ring-piedra-250"
                  />
                </label>
                <label className="block">
                  <span className="label-sm text-grafito-600">Largo (m)</span>
                  <input
                    type="number"
                    min={1}
                    max={floor.height}
                    step={0.5}
                    value={selected.h}
                    onChange={(e) =>
                      updateRoom(selected.id, {
                        h: clamp(Number(e.target.value) || 1, 1, floor.height - selected.y),
                      })
                    }
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
                        className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-negro/80 text-crema-100 opacity-0 transition-opacity group-hover:opacity-100"
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
                  onChange={(e) => updateRoom(selected.id, { note: e.target.value || undefined })}
                  placeholder="Ej.: cabe una cama queen o un escritorio…"
                  className="mt-1 h-9 w-full rounded-ctl bg-crema-100 px-3 text-[14px] ring-1 ring-piedra-250 outline-none focus:ring-negro"
                />
              </label>
            </div>
          ) : (
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
