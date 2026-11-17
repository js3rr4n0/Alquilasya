"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { endDate, type DurationKey } from "../lib/durations";
import {
  addDays,
  cx,
  dateDay,
  fromIsoDay,
  isoDay,
  monthYear,
  sameDay,
  startOfDay,
} from "../lib/format";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function inRanges(d: Date, ranges: [Date, Date][]) {
  return ranges.some(([a, b]) => d >= a && d <= b);
}

export function overlapsBooked(
  start: Date,
  duration: DurationKey,
  booked: [string, string][] = [],
) {
  const end = endDate(start, duration);
  return booked.some(([a, b]) => {
    const from = fromIsoDay(a);
    const to = fromIsoDay(b);
    return start <= to && addDays(end, -1) >= from;
  });
}

export function Calendar({
  start,
  duration,
  onSelect,
  booked = [],
  minDate,
  className,
}: {
  start: Date;
  duration: DurationKey;
  onSelect: (d: Date) => void;
  booked?: [string, string][];
  minDate?: Date;
  className?: string;
}) {
  const [view, setView] = useState(() => new Date(start.getFullYear(), start.getMonth(), 1));
  const today = startOfDay(new Date());
  const min = minDate && minDate > today ? minDate : today;
  const ranges = useMemo(
    () => booked.map(([a, b]) => [fromIsoDay(a), fromIsoDay(b)] as [Date, Date]),
    [booked],
  );
  const end = endDate(start, duration);
  const lastNight = addDays(end, -1);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const list: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let i = 1; i <= days; i++) list.push(new Date(view.getFullYear(), view.getMonth(), i));
    while (list.length % 7) list.push(null);
    return list;
  }, [view]);

  const canPrev =
    new Date(view.getFullYear(), view.getMonth(), 0) >=
    startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className={cx("select-none", className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          disabled={!canPrev}
          aria-label="Mes anterior"
          className="inline-flex size-8 items-center justify-center rounded-ctl hover:bg-arena-200 disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-[14px] font-semibold tracking-[-0.01em]" aria-live="polite">
          {monthYear(view)}
        </p>
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          aria-label="Mes siguiente"
          className="inline-flex size-8 items-center justify-center rounded-ctl hover:bg-arena-200"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div
        className="grid grid-cols-7 text-center"
        role="grid"
        aria-label={`Calendario de ${monthYear(view)}`}
      >
        {WEEKDAYS.map((w, i) => (
          <div key={`${w}${i}`} className="label-sm pb-2 text-grafito-600" role="columnheader">
            {w}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const disabled = d < min || inRanges(d, ranges);
          const booked_ = inRanges(d, ranges);
          const isStart = sameDay(d, start);
          const isEnd = sameDay(d, end);
          const middle = d > start && d <= lastNight;
          const band =
            isStart && end > start
              ? "left-1/2 right-0"
              : middle
                ? "inset-x-0"
                : isEnd
                  ? "left-0 right-1/2"
                  : "";
          return (
            <div key={isoDay(d)} className="relative py-[2px]">
              {band && (
                <span aria-hidden className={cx("absolute inset-y-[2px] bg-arena-200", band)} />
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(d)}
                aria-pressed={isStart}
                aria-label={`${dateDay(d)}${booked_ ? ", ocupado" : ""}${isStart ? ", entrada" : ""}${isEnd ? ", salida" : ""}`}
                className={cx(
                  "relative mx-auto flex size-9 items-center justify-center rounded-[3px] text-[14px] tabular-nums transition-colors",
                  isStart
                    ? "bg-negro font-semibold text-crema-100"
                    : isEnd
                      ? "bg-crema-050 font-semibold text-negro ring-1 ring-negro"
                      : disabled
                        ? booked_
                          ? "cursor-not-allowed text-piedra-500 line-through decoration-piedra-400"
                          : "cursor-not-allowed text-piedra-400"
                        : "text-negro hover:bg-piedra-250/60",
                )}
              >
                {d.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
