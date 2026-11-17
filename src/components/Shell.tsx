"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Marco común: cabecera, contenido y pie. El chat ocupa toda la altura, sin pie. */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const bare = pathname.startsWith("/admin");
  const hideFooter = pathname.startsWith("/mensajes") || bare;
  return (
    <StoreProvider>
      <div className="flex min-h-dvh flex-col">
        <Header />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        {!hideFooter && <Footer />}
      </div>
    </StoreProvider>
  );
}
