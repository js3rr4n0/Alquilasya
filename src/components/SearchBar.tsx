"use client";

import { ArrowRight, CalendarDays, ChevronDown, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@/lib/router";
import { departments, districtsOf } from "../lib/geo";
import { endDate } from "../lib/durations";
import { cx, dateShort, fromIsoDay, isoDay } from "../lib/format";
import { useStore } from "../lib/store";
import { Calendar } from "./Calendar";
import { DurationPicker } from "./DurationPicker";

export function useOutsideClose<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function DateField({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const { start, setStart, duration } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose<HTMLDivElement>(open, () => setOpen(false));
  const startDate = fromIsoDay(start);
  const dark = tone === "dark";
  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cx(
          "flex h-14 w-full items-center gap-3 rounded-ctl px-3.5 text-left transition-colors",
          dark
            ? "bg-crema-100/[0.07] ring-1 ring-crema-100/15 hover:ring-crema-100/35"
            : "bg-crema-050 ring-1 ring-piedra-250 hover:ring-negro",
        )}
      >
        <CalendarDays className={cx("size-4", dark ? "text-piedra-300" : "text-grafito-600")} />
        <span className="min-w-0 flex-1">
          <span className={cx("block text-[14px] leading-tight", dark ? "text-piedra-300" : "text-grafito-600")}>
            Desde
          </span>
          <span className="block truncate text-[15px] font-medium tabular-nums">
            {dateShort(startDate)}
            <span className={dark ? "text-piedra-300" : "text-grafito-600"}>
              {" "}
              → {dateShort(endDate(startDate, duration))}
            </span>
          </span>
        </span>
        <ChevronDown className="size-4 opacity-60" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Elegir fecha de entrada"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(318px,calc(100vw-2.5rem))] animate-rise rounded-card bg-crema-050 p-4 text-negro shadow-[0_24px_60px_-20px_rgb(10_10_10/0.55)] ring-1 ring-arena-200"
        >
          <Calendar
            start={startDate}
            duration={duration}
            onSelect={(d) => {
              setStart(isoDay(d));
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ZoneField({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const { zone, setZone } = useStore();
  const dark = tone === "dark";
  return (
    <label
      className={cx(
        "relative flex h-14 items-center gap-3 rounded-ctl px-3.5 transition-colors",
        dark
          ? "bg-crema-100/[0.07] ring-1 ring-crema-100/15 focus-within:ring-crema-100/50 hover:ring-crema-100/35"
          : "bg-crema-050 ring-1 ring-piedra-250 hover:ring-negro",
        className,
      )}
    >
      <MapPin className={cx("size-4 shrink-0", dark ? "text-piedra-300" : "text-grafito-600")} />
      <span className="min-w-0 flex-1">
        <span className={cx("block text-[14px] leading-tight", dark ? "text-piedra-300" : "text-grafito-600")}>
          Dónde
        </span>
        <select
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          className="w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-[16px] font-medium outline-none [&_optgroup]:bg-crema-050 [&_optgroup]:text-grafito-700 [&_option]:bg-crema-050 [&_option]:text-negro"
        >
          <option value="">Todo El Salvador</option>
          {departments.map((d) => (
            <optgroup key={d.id} label={d.name}>
              <option value={`dep:${d.id}`}>Todo {d.name}</option>
              {districtsOf(d.id).map((x) => (
                <option key={x.id} value={`dis:${x.id}`}>
                  {x.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </span>
      <ChevronDown className="pointer-events-none absolute right-3.5 size-4 opacity-60" />
    </label>
  );
}

export function SearchBar({ className }: { className?: string }) {
  const { duration, setDuration, zone } = useStore();
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/explorar${zone ? `?zona=${encodeURIComponent(zone)}` : ""}`);
      }}
      className={cx(
        "rounded-card bg-tinta-900/80 p-3 ring-1 ring-crema-100/12 backdrop-blur-[2px] sm:p-4",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <span className="px-0.5 text-[14px] text-piedra-300" id="duracion-label">
          ¿Cuánto tiempo?
        </span>
        <DurationPicker
          value={duration}
          onChange={setDuration}
          tone="dark"
          size="lg"
          stretch
          compact
        />
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_1fr_auto]">
        <ZoneField />
        <DateField />
        <button
          type="submit"
          className="inline-flex h-14 items-center justify-center gap-2 rounded-ctl bg-crema-100 px-6 text-[16px] font-semibold text-negro transition-colors hover:bg-white"
        >
          Buscar <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}
