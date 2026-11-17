"use client";

/**
 * Capa mínima con la forma de react-router sobre el App Router de Next.
 * Las vistas vienen del prototipo y hablan este dialecto; así no hay que
 * reescribirlas una por una.
 */
import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import { useCallback, useMemo, type ComponentProps, type ReactNode } from "react";

export type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { to: string };

export function Link({ to, ...props }: LinkProps) {
  return <NextLink href={to} {...props} />;
}

type NavState = { isActive: boolean };

export function NavLink({
  to,
  end,
  className,
  children,
  ...props
}: Omit<LinkProps, "className" | "children"> & {
  end?: boolean;
  className?: string | ((s: NavState) => string);
  children?: ReactNode | ((s: NavState) => ReactNode);
}) {
  const pathname = usePathname() ?? "/";
  const target = to.split("?")[0];
  const isActive =
    end || target === "/"
      ? pathname === target
      : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <NextLink
      href={to}
      aria-current={isActive ? "page" : undefined}
      className={typeof className === "function" ? className({ isActive }) : className}
      {...props}
    >
      {typeof children === "function" ? children({ isActive }) : children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string, opts?: { replace?: boolean }) =>
      opts?.replace ? router.replace(to) : router.push(to),
    [router],
  );
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  const raw = useNextParams() ?? {};
  return useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      const value = Array.isArray(v) ? v[0] : v;
      if (typeof value === "string") out[k] = decodeURIComponent(value);
    }
    return out as Partial<T>;
  }, [raw]);
}

export function useLocation() {
  const pathname = usePathname() ?? "/";
  return { pathname };
}

export function useSearchParams() {
  const params = useNextSearchParams();
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const set = useCallback(
    (next: Record<string, string>, opts?: { replace?: boolean }) => {
      const qs = new URLSearchParams(next).toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router],
  );
  return [params ?? new URLSearchParams(), set] as const;
}
