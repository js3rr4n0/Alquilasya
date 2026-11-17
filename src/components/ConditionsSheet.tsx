"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { CONDITION_ORDER, CONDITIONS } from "../data/conditions";
import type { Condition } from "../data/types";
import { cx } from "../lib/format";
import { StatusMark } from "./ui";

export function ConditionsSheet({
  conditions,
  className,
  columns = 2,
}: {
  conditions: Condition[];
  className?: string;
  columns?: 1 | 2;
}) {
  const ordered = CONDITION_ORDER.map((k) => conditions.find((c) => c.key === k)).filter(
    Boolean,
  ) as Condition[];
  const [pinnedKey, setPinnedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);

  return (
    <dl className={cx("grid gap-2", columns === 2 ? "sm:grid-cols-2" : "grid-cols-1", className)}>
      {ordered.map((c) => {
        const open = Boolean(c.detail) && (pinnedKey === c.key || hoverKey === c.key);
        return (
          <div
            key={c.key}
            onMouseEnter={() => c.detail && setHoverKey(c.key)}
            onMouseLeave={() => setHoverKey((k) => (k === c.key ? null : k))}
            onClick={() => c.detail && setPinnedKey((k) => (k === c.key ? null : c.key))}
            role={c.detail ? "button" : undefined}
            tabIndex={c.detail ? 0 : undefined}
            aria-expanded={c.detail ? open : undefined}
            onKeyDown={(e) => {
              if (c.detail && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setPinnedKey((k) => (k === c.key ? null : c.key));
              }
            }}
            className={cx(
              "rounded-ctl bg-crema-100 px-3.5 py-3 ring-1 transition-colors",
              open ? "bg-negro text-crema-100 ring-negro" : "ring-piedra-250/80 hover:ring-negro",
              c.detail && "cursor-pointer",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <StatusMark status={c.status} />
                <dt className={cx("truncate text-[15px]", open ? "text-piedra-300" : "text-grafito-700")}>
                  {CONDITIONS[c.key].label}
                </dt>
              </div>
              <dd className="flex min-w-0 items-center gap-1.5 text-right">
                <span
                  className={cx(
                    "text-[15px] font-semibold tracking-[-0.01em]",
                    open ? "text-crema-100" : "text-negro",
                  )}
                >
                  {c.value}
                </span>
                {c.detail && (
                  <Plus
                    className={cx(
                      "size-3.5 opacity-60 transition-transform",
                      open && "rotate-45 opacity-100",
                    )}
                    aria-hidden
                  />
                )}
              </dd>
            </div>
            {open && c.detail && (
              <p className="mt-2 border-t border-crema-100/15 pt-2 text-pretty text-[15px] leading-snug text-piedra-300">
                {c.detail}
              </p>
            )}
          </div>
        );
      })}
    </dl>
  );
}

/** Legend for the three marks. */
export function ConditionsLegend({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-grafito-600",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2">
        <StatusMark status="si" /> Sí
      </span>
      <span className="inline-flex items-center gap-2">
        <StatusMark status="parcial" /> Con condiciones
      </span>
      <span className="inline-flex items-center gap-2">
        <StatusMark status="no" /> No
      </span>
    </div>
  );
}
