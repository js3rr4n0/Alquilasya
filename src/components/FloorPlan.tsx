"use client";

import { ArrowLeft, ArrowRight, Camera, Eye } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { area as roomArea, ROOM_TYPES } from "../data/rooms";
import type { Floor, Room } from "../data/types";
import { cx, dec, m2 } from "../lib/format";
import { photoSrcSet, photoUrl } from "../lib/photos";
import { Segmented } from "./ui";

export const UNITS = 100; // svg units per metre

const INK = "#0A0A0A";
const CREAM = "#F5F2EB";
const PAPER = "#FBF9F5";
const SAND = "#EDE9DF";
const LINE = "#D6CCBE";

/** Keeps on-screen text size constant whatever the plan's scale. */
export function useUnitsPerPixel(viewBoxWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState(800);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPx(entry.contentRect.width || 800));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, k: viewBoxWidth / Math.max(px, 1) };
}

const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "'Instrument Sans', ui-sans-serif, sans-serif";

function fitLabel(name: string, widthUnits: number, fs: number) {
  const charW = fs * 0.64;
  const max = Math.floor(widthUnits / charW);
  if (name.length <= max) return name;
  const first = name.split(" ")[0];
  if (first.length <= max) return first;
  return max >= 3 ? `${name.slice(0, Math.max(max - 1, 2))}.` : "";
}

export function PlanDefs({ uid, k }: { uid: string; k: number }) {
  const s = 14;
  return (
    <defs>
      <pattern
        id={`hatch-${uid}`}
        width={s}
        height={s}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width={s} height={s} fill={PAPER} />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={s}
          stroke={INK}
          strokeOpacity="0.2"
          strokeWidth={Math.max(1.1 * k, 1.5)}
        />
      </pattern>
      <pattern
        id={`hatch-dark-${uid}`}
        width={s}
        height={s}
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width={s} height={s} fill={INK} />
        <line
          x1="0"
          y1="0"
          x2="0"
          y2={s}
          stroke={CREAM}
          strokeOpacity="0.28"
          strokeWidth={Math.max(1.1 * k, 1.5)}
        />
      </pattern>
    </defs>
  );
}

export function MetreGrid({ width, height }: { width: number; height: number }) {
  const lines = [];
  for (let x = 0; x <= width; x += 1)
    lines.push(<line key={`x${x}`} x1={x * UNITS} y1={0} x2={x * UNITS} y2={height * UNITS} />);
  for (let y = 0; y <= height; y += 1)
    lines.push(<line key={`y${y}`} x1={0} y1={y * UNITS} x2={width * UNITS} y2={y * UNITS} />);
  return (
    <g
      aria-hidden
      stroke={LINE}
      strokeOpacity="0.55"
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      shapeRendering="crispEdges"
    >
      {lines}
    </g>
  );
}

export function ScaleBar({ x, y, k, metres }: { x: number; y: number; k: number; metres: number }) {
  const seg = UNITS;
  const h = 7 * k;
  return (
    <g aria-hidden>
      {Array.from({ length: metres }).map((_, i) => (
        <rect
          key={i}
          x={x + i * seg}
          y={y}
          width={seg}
          height={h}
          fill={i % 2 === 0 ? INK : PAPER}
          stroke={INK}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <text
        x={x}
        y={y + h + 13 * k}
        fontFamily={MONO}
        fontSize={10 * k}
        fill={INK}
        letterSpacing={0.8 * k}
      >
        0
      </text>
      <text
        x={x + metres * seg}
        y={y + h + 13 * k}
        fontFamily={MONO}
        fontSize={10 * k}
        fill={INK}
        textAnchor="end"
        letterSpacing={0.8 * k}
      >
        {metres} M
      </text>
    </g>
  );
}

export function NorthArrow({ x, y, k }: { x: number; y: number; k: number }) {
  const s = 9 * k;
  return (
    <g aria-hidden transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${-s * 1.6} L${s * 0.75} ${s * 0.6} L0 ${s * 0.15} L${-s * 0.75} ${s * 0.6} Z`}
        fill={INK}
      />
      <text
        y={s * 2.1}
        fontFamily={MONO}
        fontSize={10 * k}
        fill={INK}
        textAnchor="middle"
        fontWeight={500}
      >
        N
      </text>
    </g>
  );
}

function DimensionLine({
  x1,
  y1,
  x2,
  y2,
  label,
  k,
  vertical,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  k: number;
  vertical?: boolean;
}) {
  const t = 5 * k;
  const fs = 10.5 * k;
  const cx_ = (x1 + x2) / 2;
  const cy_ = (y1 + y2) / 2;
  const boxW = label.length * fs * 0.64 + 10 * k;
  const boxH = fs + 7 * k;
  return (
    <g aria-hidden>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={INK}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={x1 - t}
        y1={y1 + t}
        x2={x1 + t}
        y2={y1 - t}
        stroke={INK}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={x2 - t}
        y1={y2 + t}
        x2={x2 + t}
        y2={y2 - t}
        stroke={INK}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <g transform={vertical ? `rotate(-90 ${cx_} ${cy_})` : undefined}>
        <rect x={cx_ - boxW / 2} y={cy_ - boxH / 2} width={boxW} height={boxH} fill={CREAM} />
        <text
          x={cx_}
          y={cy_ + fs * 0.36}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={fs}
          fill={INK}
          fontWeight={500}
        >
          {label}
        </text>
      </g>
    </g>
  );
}

export function RoomDimensions({ room, k, floor }: { room: Room; k: number; floor: Floor }) {
  const x = room.x * UNITS;
  const y = room.y * UNITS;
  const w = room.w * UNITS;
  const h = room.h * UNITS;
  const off = 16 * k;
  const top = room.y > 0.25 ? y - off : y + h + off;
  const left = room.x > 0.25 ? x - off : x + w + off;
  const placeTop = top > -60 && top < floor.height * UNITS + 60;
  return (
    <g>
      {placeTop && (
        <DimensionLine x1={x} y1={top} x2={x + w} y2={top} label={`${dec(room.w)} m`} k={k} />
      )}
      <DimensionLine
        x1={left}
        y1={y}
        x2={left}
        y2={y + h}
        label={`${dec(room.h)} m`}
        k={k}
        vertical
      />
    </g>
  );
}

function RoomShape({
  room,
  uid,
  k,
  active,
  interactive,
  onSelect,
}: {
  room: Room;
  uid: string;
  k: number;
  active: boolean;
  interactive: boolean;
  onSelect?: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const meta = ROOM_TYPES[room.type];
  const x = room.x * UNITS;
  const y = room.y * UNITS;
  const w = room.w * UNITS;
  const h = room.h * UNITS;
  const a = roomArea(room);

  const fill = active
    ? meta.outdoor
      ? `url(#hatch-dark-${uid})`
      : INK
    : meta.outdoor
      ? `url(#hatch-${uid})`
      : hover
        ? SAND
        : PAPER;
  const text = active ? CREAM : INK;

  const fsName = 10 * k;
  const fsArea = 13 * k;
  const pad = 8 * k;
  const name = fitLabel(room.name.toUpperCase(), w - pad * 2, fsName);
  const showArea = h > fsArea + pad * 2 && w > fsArea * 3.4;
  const showName = name && h > fsName + fsArea + pad * 3;
  const showCount = room.photos.length > 0 && w > 40 * k && h > 40 * k;
  const cy = y + h / 2;
  const dashed = meta.outdoor && !active;
  const labelW =
    Math.max(showName ? name.length * fsName * 0.66 : 0, showArea ? 6 * fsArea * 0.6 : 0) + 12 * k;
  const labelH = (showName ? fsName + 4 * k : 0) + (showArea ? fsArea + 4 * k : 0) + 8 * k;

  function onKey(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect?.(room.id);
    }
  }

  return (
    <g
      className={cx("plan-room", interactive && "cursor-pointer")}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? active : undefined}
      aria-label={`${room.name}, ${dec(room.w)} por ${dec(room.h)} metros, ${m2(a)}${room.photos.length ? `, ${room.photos.length} fotos` : ""}`}
      onClick={interactive ? () => onSelect?.(room.id) : undefined}
      onKeyDown={interactive ? onKey : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill={fill}
        stroke={dashed ? "none" : INK}
        strokeWidth={active ? 2 : 1.5}
        vectorEffect="non-scaling-stroke"
        style={{ transition: "fill .2s" }}
      />
      {dashed && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="none"
          stroke={INK}
          strokeWidth={1.5}
          strokeDasharray="5 3"
          vectorEffect="non-scaling-stroke"
        />
      )}
      {dashed && (showName || showArea) && (
        <rect
          x={x + w / 2 - labelW / 2}
          y={cy - labelH / 2}
          width={labelW}
          height={labelH}
          fill={hover ? SAND : PAPER}
          style={{ pointerEvents: "none", transition: "fill .2s" }}
        />
      )}
      {showName && (
        <text
          x={x + w / 2}
          y={showArea ? cy - fsArea * 0.35 : cy + fsName * 0.35}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize={fsName}
          fontWeight={500}
          letterSpacing={fsName * 0.1}
          fill={text}
          style={{ pointerEvents: "none" }}
        >
          {name}
        </text>
      )}
      {showArea && (
        <text
          x={x + w / 2}
          y={showName ? cy + fsArea * 0.95 : cy + fsArea * 0.35}
          textAnchor="middle"
          fontFamily={SANS}
          fontSize={fsArea}
          fontWeight={600}
          fill={text}
          style={{ pointerEvents: "none", fontVariantNumeric: "tabular-nums" }}
        >
          {dec(a, 1)} m²
        </text>
      )}
      {showCount && interactive && (
        <g
          style={{ pointerEvents: "none" }}
          transform={`translate(${x + w - 15 * k} ${y + 15 * k})`}
        >
          <circle r={8.5 * k} fill={active ? CREAM : INK} />
          <text
            y={3.4 * k}
            textAnchor="middle"
            fontFamily={SANS}
            fontSize={9.5 * k}
            fontWeight={600}
            fill={active ? INK : CREAM}
          >
            {room.photos.length + (room.view?.photo ? 1 : 0)}
          </text>
        </g>
      )}
    </g>
  );
}

export function FloorPlan({
  floor,
  selectedId,
  onSelect,
  interactive = true,
  className,
  label,
}: {
  floor: Floor;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  className?: string;
  label: string;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const M = 80;
  const vbW = floor.width * UNITS + M * 2;
  const { ref, k } = useUnitsPerPixel(vbW);
  // Room below the plan for the scale bar and north arrow, whatever the zoom.
  const B = Math.max(160, 64 + 44 * k);
  const vbH = floor.height * UNITS + M + B;
  const selected = floor.rooms.find((r) => r.id === selectedId);
  const scaleMetres = floor.width >= 14 ? 5 : floor.width >= 8 ? 3 : 2;

  return (
    <div ref={ref} className={className}>
      <svg
        viewBox={`${-M} ${-M} ${vbW} ${vbH}`}
        className="block h-auto w-full select-none"
        role="group"
        aria-label={label}
      >
        <PlanDefs uid={uid} k={k} />
        <MetreGrid width={floor.width} height={floor.height} />
        {floor.rooms.map((room) => (
          <RoomShape
            key={room.id}
            room={room}
            uid={uid}
            k={k}
            active={room.id === selectedId}
            interactive={interactive}
            onSelect={onSelect}
          />
        ))}
        {selected && <RoomDimensions room={selected} k={k} floor={floor} />}
        <ScaleBar x={0} y={floor.height * UNITS + 64} k={k} metres={scaleMetres} />
        <NorthArrow x={floor.width * UNITS - 12 * k} y={floor.height * UNITS + 82} k={k} />
      </svg>
    </div>
  );
}

export function RoomDetail({
  room,
  index,
  total,
  onPrev,
  onNext,
  context,
}: {
  room: Room;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  context: string;
}) {
  const meta = ROOM_TYPES[room.type];
  const shots = useMemo(() => {
    const list = room.photos.map((p) => ({ src: p, view: false }));
    if (room.view?.photo) list.push({ src: room.view.photo, view: true });
    return list;
  }, [room]);
  const [shot, setShot] = useState(0);
  useEffect(() => setShot(0), [room.id]);
  const current = shots[Math.min(shot, shots.length - 1)];

  return (
    <div className="flex h-full w-full max-w-[640px] flex-col lg:max-w-none">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-arena-200">
        {current ? (
          <img
            key={current.src}
            src={photoUrl(current.src, 1200, 900)}
            srcSet={photoSrcSet(current.src, [600, 900, 1200, 1600], 0.75)}
            sizes="(min-width: 1024px) 40vw, 92vw"
            alt={`${current.view ? `Vista desde ${room.name.toLowerCase()}` : room.name}, ${context}`}
            className="size-full animate-fade object-cover"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-grafito-600">
            <Camera className="size-6" />
            <span className="text-[14px]">Este espacio aún no tiene fotos</span>
          </div>
        )}
      </div>
      {shots.length > 1 && (
        <div className="mt-2.5 flex gap-2" role="tablist" aria-label={`Fotos de ${room.name}`}>
          {shots.map((s, i) => (
            <button
              key={`${s.src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === shot}
              aria-label={s.view ? "La vista" : `Foto ${i + 1}`}
              onClick={() => setShot(i)}
              className={cx(
                "relative h-14 w-[74px] overflow-hidden rounded-[3px] bg-arena-200 ring-offset-2 ring-offset-crema-100 transition",
                i === shot ? "ring-2 ring-negro" : "opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={photoUrl(s.src, 200, 150)}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
              {s.view && (
                <span className="absolute inset-x-0 bottom-0 bg-negro/75 py-0.5 text-center text-[11px] font-medium tracking-[0.06em] text-crema-100">
                  VISTA
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label text-grafito-600">
            Espacio {index + 1} de {total} · {meta.outdoor ? "Exterior" : "Interior"}
          </p>
          <h3 className="head mt-2 text-[26px]">{room.name}.</h3>
          <p className="mt-1.5 text-[15px] tabular-nums text-grafito-700">
            {dec(room.w)} × {dec(room.h)} m ·{" "}
            <span className="font-semibold text-negro">{m2(roomArea(room))}</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-1.5 pt-5">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Espacio anterior"
            className="inline-flex size-9 items-center justify-center rounded-ctl ring-1 ring-piedra-250 hover:bg-arena-200"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Espacio siguiente"
            className="inline-flex size-9 items-center justify-center rounded-ctl ring-1 ring-piedra-250 hover:bg-arena-200"
          >
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>

      {room.view && (
        <button
          type="button"
          onClick={() => room.view?.photo && setShot(shots.length - 1)}
          disabled={!room.view.photo}
          className="mt-4 flex w-full items-center gap-3 rounded-ctl bg-arena-200 px-3.5 py-3 text-left transition-colors enabled:hover:bg-piedra-250/60"
        >
          <Eye className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="label block text-grafito-600">Vista</span>
            <span className="block text-[15px] font-semibold">{room.view.label}</span>
          </span>
          {room.view.photo && (
            <span className="text-[14px] font-medium text-terracota-700 underline underline-offset-4">
              Ver la vista
            </span>
          )}
        </button>
      )}

      {room.features && room.features.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {room.features.map((f) => (
            <li
              key={f}
              className="rounded-[3px] px-2.5 py-1 text-[14px] text-grafito-700 ring-1 ring-piedra-250"
            >
              {f}
            </li>
          ))}
        </ul>
      )}
      {room.note && (
        <p className="serif-text mt-4 text-pretty text-[17px] leading-snug text-grafito-700 italic">
          “{room.note}”
        </p>
      )}
    </div>
  );
}

/** Plan + room detail, wired together. */
export function PlanExplorer({
  floors,
  context,
  className,
  initialRoomId,
  dense,
}: {
  floors: Floor[];
  context: string;
  className?: string;
  initialRoomId?: string;
  dense?: boolean;
}) {
  const [floorIndex, setFloorIndex] = useState(0);
  const floor = floors[Math.min(floorIndex, floors.length - 1)];
  const [selectedId, setSelectedId] = useState<string>(initialRoomId ?? floor?.rooms[0]?.id ?? "");

  useEffect(() => {
    if (!floor) return;
    if (!floor.rooms.some((r) => r.id === selectedId)) setSelectedId(floor.rooms[0]?.id ?? "");
  }, [floor, selectedId]);

  if (!floor) return null;
  const rooms = floor.rooms;
  const index = Math.max(
    0,
    rooms.findIndex((r) => r.id === selectedId),
  );
  const room = rooms[index];
  const go = (d: number) => setSelectedId(rooms[(index + d + rooms.length) % rooms.length].id);
  const total = rooms.reduce((s, r) => s + (ROOM_TYPES[r.type].outdoor ? 0 : roomArea(r)), 0);
  const outdoor = rooms.reduce((s, r) => s + (ROOM_TYPES[r.type].outdoor ? roomArea(r) : 0), 0);

  return (
    <div
      className={cx(
        "grid gap-8 lg:gap-10",
        dense ? "2xl:grid-cols-[1.25fr_1fr]" : "lg:grid-cols-[1.35fr_1fr]",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {floors.length > 1 ? (
            <Segmented
              label="Planta"
              size="sm"
              value={String(floorIndex)}
              onChange={(v) => setFloorIndex(Number(v))}
              options={floors.map((f, i) => ({ value: String(i), label: f.name }))}
            />
          ) : (
            <p className="label text-grafito-600">{floor.name}</p>
          )}
          <p className="text-[14px] tabular-nums text-grafito-600">
            {rooms.length} espacios · {m2(Math.round(total))} interiores
            {outdoor > 0 && ` · ${m2(Math.round(outdoor))} exteriores`}
          </p>
        </div>
        <div className="rounded-card bg-crema-050 p-3 ring-1 ring-arena-200 sm:p-5">
          <div className="-mx-1 overflow-x-auto px-1 no-scrollbar">
            <FloorPlan
              floor={floor}
              selectedId={room?.id}
              onSelect={setSelectedId}
              label={`Plano de ${context}, ${floor.name}. Toca un espacio para ver sus fotos.`}
            />
          </div>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[14px] text-grafito-600">
          <span
            className="inline-block h-3 w-5 border border-dashed border-negro hatch"
            aria-hidden
          />{" "}
          Exterior
          <span
            className="ml-3 inline-flex size-5 items-center justify-center rounded-full bg-negro text-[11px] font-semibold text-crema-100"
            aria-hidden
          >
            2
          </span>
          Fotos del espacio · Toca cualquier espacio
        </p>
      </div>
      {room && (
        <RoomDetail
          room={room}
          index={index}
          total={rooms.length}
          onPrev={() => go(-1)}
          onNext={() => go(1)}
          context={context}
        />
      )}
    </div>
  );
}
