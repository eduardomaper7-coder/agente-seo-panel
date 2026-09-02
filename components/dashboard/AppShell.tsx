"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { NAV_ITEMS } from "./nav";
import { SignOutButton } from "./SignOutButton";
import { AibeLogo } from "@/components/ui/AibeLogo";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const activo = item.href === "/dashboard" ? pathname === item.href : pathname?.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activo ? "bg-accent/10 text-accent" : "text-ink/60 hover:bg-ink/[0.04] hover:text-ink"
            }`}
          >
            <Icon size={17} strokeWidth={activo ? 2.25 : 1.9} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ nombreNegocio, email }: { nombreNegocio: string; email?: string | null }) {
  return (
    <div className="border-t border-ink/10 pt-3">
      <p className="truncate text-sm font-medium text-ink">{nombreNegocio}</p>
      {email && <p className="truncate text-xs text-ink/40">{email}</p>}
      <SignOutButton className="mt-2" />
    </div>
  );
}

export function AppShell({
  nombreNegocio,
  email,
  demo,
  children,
}: {
  nombreNegocio: string;
  email?: string | null;
  demo?: boolean;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar de escritorio — fija, siempre visible en md+ */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink/10 bg-white px-4 py-5 md:flex">
        <div className="mb-1 px-1">
          <AibeLogo />
        </div>
        <p className="mb-5 px-1 text-xs uppercase tracking-wide text-ink/35">SEO · Posicionamiento</p>
        <NavLinks />
        <SidebarFooter nombreNegocio={nombreNegocio} email={email} />
      </aside>

      {/* Topbar móvil */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 md:hidden">
        <AibeLogo />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-ink/60 hover:bg-ink/[0.05]"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Menú deslizante móvil */}
      {abierto && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setAbierto(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white px-4 py-5 shadow-aibe-md">
            <div className="mb-5 flex items-center justify-between px-1">
              <AibeLogo />
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink/60 hover:bg-ink/[0.05]"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setAbierto(false)} />
            <SidebarFooter nombreNegocio={nombreNegocio} email={email} />
          </div>
        </div>
      )}

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {demo && (
            <div className="mb-6 rounded-md border border-warn/30 bg-warn/10 px-4 py-2.5 text-sm text-warn">
              Mostrando datos de ejemplo — este panel se conecta a datos reales en cuanto haya sesión e
              integración con Supabase activas.
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
