"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "@/lib/router";
import { Logotipo } from "../brand/Logo";
import { cx } from "../lib/format";
import { useStore } from "../lib/store";
import { ButtonLink } from "./ui";

const NAV = [
  { to: "/explorar", label: "Explorar" },
  { to: "/publicar", label: "Publicar" },
  { to: "/lista", label: "Lista de espera" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useStore();
  const account = user
    ? { to: "/cuenta", label: user.name.split(" ")[0] }
    : { to: "/entrar", label: "Entrar" };

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="on-dark sticky top-0 z-[1000] border-b border-crema-100/10 bg-negro text-crema-100">
      <div className="mx-auto flex h-[68px] w-full max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Por debajo de 200 px el logotipo va en una sola tinta (manual de marca). */}
        <Link to="/" className="shrink-0 py-2" aria-label="AlquilasYa, inicio">
          <Logotipo width={184} tone="crema" className="hidden md:block" />
          <Logotipo width={140} tone="crema" className="md:hidden" />
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cx(
                  "relative inline-flex h-10 items-center gap-2 rounded-ctl px-3.5 text-[15px] font-medium transition-colors",
                  isActive ? "text-crema-100" : "text-piedra-300 hover:text-crema-100",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3.5 -bottom-[13px] h-px bg-crema-100"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink to={account.to} variant="ghostLight" size="sm">
            {account.label}
          </ButtonLink>
          <ButtonLink to="/publicar" variant="cream" size="sm">
            Publicar gratis
          </ButtonLink>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="relative -mr-2 inline-flex size-11 items-center justify-center rounded-ctl hover:bg-crema-100/10 md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="dots fixed inset-x-0 bottom-0 top-[68px] z-[999] animate-fade overflow-y-auto bg-negro md:hidden"
        >
          <nav aria-label="Principal" className="flex flex-col px-5 pt-6 sm:px-8">
            {[{ to: "/", label: "Inicio" }, ...NAV, { to: account.to, label: user ? "Mi cuenta" : "Entrar" }].map((item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cx(
                    "flex items-baseline justify-between border-b border-crema-100/10 py-5",
                    isActive ? "text-crema-100" : "text-piedra-300",
                  )
                }
              >
                <span className="serif text-[34px] leading-none">{item.label}</span>
                <span className="label text-terracota-300">0{i + 1}</span>
              </NavLink>
            ))}
          </nav>
          <div className="px-5 pb-10 pt-8 sm:px-8">
            <ButtonLink to="/publicar" variant="cream" size="lg" className="w-full">
              Publicar gratis
            </ButtonLink>
            <p className="mt-4 text-[14px] text-piedra-300">
              Publicar es gratis. Siempre.
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
