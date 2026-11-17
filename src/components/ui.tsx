"use client";

import { Check, ChevronDown, Minus, Plus, Star, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Link, type LinkProps } from "@/lib/router";
import type { ConditionStatus } from "../data/types";
import { cx } from "../lib/format";
import { photoUrl } from "../lib/photos";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cx("mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16", className)}>
      {children}
    </div>
  );
}

/** Running header in mono, like the manual's page folios. */
export function Folio({
  left,
  right,
  tone = "light",
  className,
}: {
  left: ReactNode;
  right?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div className={cx("flex items-baseline justify-between gap-6", className)}>
      <span className={cx("label", tone === "dark" ? "text-terracota-300" : "text-terracota-700")}>
        {left}
      </span>
      {right && (
        <span
          className={cx(
            "label hidden text-right sm:block",
            tone === "dark" ? "text-piedra-300" : "text-grafito-600",
          )}
        >
          {right}
        </span>
      )}
    </div>
  );
}

export function Eyebrow({
  index,
  children,
  tone = "light",
  className,
}: {
  index?: string;
  children: ReactNode;
  tone?: "light" | "dark" | "neutral";
  className?: string;
}) {
  const color =
    tone === "dark"
      ? "text-terracota-300"
      : tone === "neutral"
        ? "text-grafito-600"
        : "text-terracota-700";
  return (
    <p className={cx("label", color, className)}>
      {index && <span>{index} · </span>}
      {children}
    </p>
  );
}

type Variant = "primary" | "ink" | "cream" | "outline" | "outlineLight" | "ghost" | "ghostLight";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-terracota-600 text-white hover:bg-terracota-700",
  ink: "bg-negro text-crema-100 hover:bg-tinta-800",
  cream: "bg-crema-100 text-negro hover:bg-white",
  outline: "border border-negro/80 text-negro hover:bg-negro hover:text-crema-100",
  outlineLight:
    "border border-crema-100/35 text-crema-100 hover:border-crema-100 hover:bg-crema-100/5",
  ghost: "text-negro hover:bg-arena-200",
  ghostLight: "text-crema-100 hover:bg-crema-100/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-[14px]",
  md: "h-11 px-5 text-[15px]",
  lg: "h-14 px-7 text-[16px]",
};

export function buttonClass(variant: Variant = "ink", size: Size = "md", className?: string) {
  return cx(
    "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-ctl font-medium tracking-[-0.005em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "ink",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "ink",
  size = "md",
  className,
  ...props
}: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

type BadgeTone = "exito" | "aviso" | "error" | "info" | "neutral" | "ink" | "outline" | "dark";

const BADGES: Record<BadgeTone, string> = {
  exito: "bg-exito-bg text-exito",
  aviso: "bg-aviso-bg text-aviso",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  neutral: "bg-arena-200 text-grafito-700",
  ink: "bg-negro text-crema-100",
  outline: "border border-piedra-250 text-grafito-700",
  dark: "border border-crema-100/20 text-piedra-300",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-[3px] px-2 py-[3px] text-[14px] font-medium leading-[18px] tracking-[-0.003em]",
        BADGES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  disabled?: boolean;
  title?: string;
};

/** A radiogroup with arrow-key support. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  tone = "light",
  size = "md",
  label,
  className,
  stretch,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  label: string;
  className?: string;
  stretch?: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent, index: number) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const pos = enabled.indexOf(index);
    let next = enabled[pos];
    if (e.key === "Home") next = enabled[0];
    else if (e.key === "End") next = enabled[enabled.length - 1];
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else next = enabled[(pos + 1) % enabled.length];
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  const dark = tone === "dark";
  const h =
    size === "sm"
      ? "h-9 text-[14px] px-2.5"
      : size === "lg"
        ? "h-12 text-[15px] px-2.5 sm:px-4"
        : "h-10 text-[14px] px-3";

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx(
        "inline-flex rounded-ctl p-[3px]",
        dark
          ? "bg-crema-100/[0.07] ring-1 ring-crema-100/15"
          : "bg-arena-200 ring-1 ring-piedra-250/70",
        stretch && "flex w-full",
        className,
      )}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={o.disabled}
            title={o.title}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(o.value)}
            className={cx(
              "relative inline-flex items-center justify-center whitespace-nowrap rounded-[3px] font-medium transition-colors duration-200",
              h,
              stretch && "min-w-0 flex-1",
              active
                ? dark
                  ? "bg-crema-100 text-negro"
                  : "bg-negro text-crema-100"
                : dark
                  ? "text-piedra-300 hover:text-crema-100"
                  : "text-grafito-700 hover:text-negro",
              o.disabled && "cursor-not-allowed line-through decoration-1 opacity-45",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  tone = "light",
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const id = useId();
  const dark = tone === "dark";
  return (
    <div className={cx("flex items-start justify-between gap-4", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span
          className={cx("block text-[14px] font-medium", dark ? "text-crema-100" : "text-negro")}
        >
          {label}
        </span>
        {description && (
          <span
            className={cx(
              "mt-0.5 block text-[14px] leading-snug",
              dark ? "text-piedra-300" : "text-grafito-600",
            )}
          >
            {description}
          </span>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-200",
          checked
            ? dark
              ? "bg-crema-100"
              : "bg-negro"
            : dark
              ? "bg-crema-100/20"
              : "bg-piedra-250",
        )}
      >
        <span
          className={cx(
            "inline-block size-[18px] rounded-full shadow-[0_1px_2px_rgb(10_10_10/0.2)] transition-transform duration-200 ease-umbral",
            checked ? "translate-x-[19px]" : "translate-x-[3px]",
            checked && dark ? "bg-negro" : "bg-crema-050",
          )}
        />
      </button>
    </div>
  );
}

export function Avatar({
  src,
  name,
  initials,
  size = 40,
  reserved,
  className,
  square,
}: {
  src?: string;
  name: string;
  initials?: string;
  size?: number;
  reserved?: boolean;
  className?: string;
  square?: boolean;
}) {
  const shape = square ? "rounded-[3px]" : "rounded-full";
  if (reserved) {
    return (
      <span
        role="img"
        aria-label="Inquilina en modo reservado"
        className={cx(
          "hatch inline-flex shrink-0 items-center justify-center bg-arena-200 text-grafito-700 ring-1 ring-piedra-250",
          shape,
          className,
        )}
        style={{ width: size, height: size }}
      >
        <span
          className="mono font-medium tracking-[0.1em]"
          style={{ fontSize: Math.max(9, size * 0.24) }}
        >
          RES
        </span>
      </span>
    );
  }
  if (!src) {
    const text =
      initials ??
      name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("");
    return (
      <span
        role="img"
        aria-label={name}
        className={cx(
          "inline-flex shrink-0 items-center justify-center bg-negro font-semibold text-crema-100",
          shape,
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {text}
      </span>
    );
  }
  return (
    <img
      src={photoUrl(src, Math.round(size * 2.5), Math.round(size * 2.5))}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      className={cx("shrink-0 bg-arena-200 object-cover", shape, className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Score({
  value,
  count,
  className,
  tone = "light",
}: {
  value: number;
  count?: number;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 text-[14px] tabular-nums", className)}>
      <Star
        className={cx(
          "size-3.5",
          tone === "dark" ? "fill-crema-100 text-crema-100" : "fill-negro text-negro",
        )}
        aria-hidden
      />
      <span className="font-semibold">{value.toFixed(1).replace(".", ",")}</span>
      {count !== undefined && (
        <span className={tone === "dark" ? "text-piedra-300" : "text-grafito-600"}>
          · {count} reseñas
        </span>
      )}
    </span>
  );
}

/** Typographic status mark for conditions: yes, with conditions, no. */
export function StatusMark({ status, className }: { status: ConditionStatus; className?: string }) {
  if (status === "si")
    return (
      <span
        className={cx(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-exito-bg text-exito",
          className,
        )}
      >
        <Check className="size-3" strokeWidth={2.4} aria-hidden />
        <span className="sr-only">Sí</span>
      </span>
    );
  if (status === "parcial")
    return (
      <span
        className={cx(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-grafito-600 text-[14px] font-semibold leading-none text-grafito-700",
          className,
        )}
      >
        <span aria-hidden className="translate-y-[2px]">
          *
        </span>
        <span className="sr-only">Con condiciones</span>
      </span>
    );
  return (
    <span
      className={cx(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-arena-200 text-grafito-700",
        className,
      )}
    >
      <Minus className="size-3" strokeWidth={2.4} aria-hidden />
      <span className="sr-only">No</span>
    </span>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
  label,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(
      () =>
        ref.current?.querySelector<HTMLElement>("button, [href], input, textarea, select")?.focus(),
      20,
    );
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center sm:p-6"
      role="presentation"
    >
      <div className="absolute inset-0 animate-fade bg-negro/60" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cx(
          "relative max-h-[92vh] w-full animate-rise overflow-y-auto rounded-t-card bg-crema-050 shadow-[0_24px_80px_-20px_rgb(10_10_10/0.5)] sm:rounded-card",
          wide ? "sm:max-w-5xl" : "sm:max-w-lg",
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-arena-200 bg-crema-050 px-5 py-4 sm:px-6">
          <div className="min-w-0 text-[15px] font-semibold tracking-[-0.01em]">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 inline-flex size-9 items-center justify-center rounded-ctl text-grafito-700 hover:bg-arena-200 hover:text-negro"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Progressive disclosure behind a real button, so it works the same on touch.
 */
export function MoreInfo({
  summary = "Ver detalle",
  children,
  tone = "light",
  className,
}: {
  summary?: ReactNode;
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const dark = tone === "dark";

  return (
    <div className={cx("block max-w-full", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex min-h-9 items-center gap-1.5 rounded-ctl px-3 py-1.5 text-[14px] font-medium transition-colors",
          dark
            ? open
              ? "bg-crema-100 text-negro"
              : "bg-crema-100/10 text-piedra-300 hover:text-crema-100"
            : open
              ? "bg-negro text-crema-100"
              : "bg-arena-200 text-grafito-700 hover:text-negro",
        )}
      >
        <Plus className={cx("size-3 transition-transform", open && "rotate-45")} />
        <span>{summary}</span>
        <ChevronDown
          className={cx("size-3 opacity-60 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          className={cx(
            "mt-2 max-w-[54ch] animate-fade rounded-ctl p-3.5 text-pretty text-[15px] leading-relaxed ring-1",
            dark
              ? "bg-tinta-900 text-piedra-300 ring-crema-100/15"
              : "bg-crema-050 text-grafito-700 ring-piedra-250",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function SectionTitle({
  index,
  kicker,
  title,
  lead,
  tone = "light",
  className,
  as: As = "h2",
}: {
  index?: string;
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "light" | "dark";
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const dark = tone === "dark";
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <Eyebrow index={index} tone={dark ? "dark" : "light"}>
          {kicker}
        </Eyebrow>
      </div>
      <As
        className={cx(
          "head mt-3 text-balance text-[32px] sm:text-[42px] lg:text-[48px]",
          dark ? "text-crema-100" : "text-negro",
        )}
      >
        {title}
      </As>
      {lead && (
        <p
          className={cx(
            "mt-4 max-w-[60ch] text-pretty text-[16px] leading-relaxed",
            dark ? "text-piedra-300" : "text-grafito-700",
          )}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
