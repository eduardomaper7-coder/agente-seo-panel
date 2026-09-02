"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutGrid, ListChecks, Menu, Radar, TrendingUp, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { AibeLogo } from "@/components/ui/AibeLogo";

// Réplica de AppShell/nav.ts pensada para que un administrador vea el panel
// de un cliente concreto (/admin/clientes/[id]/...) sin depender de una
// sesión iniciada como ese cliente: los enlaces apuntan siempre a rutas
// /admin/clientes/{id}/..., nunca a /dashboard/... — así nunca se mezcla la
// sesión del administrador con la vista de un cliente.
function navItems(clienteId: string) {
  const base = `/admin/clientes/${clienteId}`;
  return [
    { href: base, label: "Resumen", icon: LayoutGrid },
    { href: `${base}/palabras-clave`, label: "Palabras clave", icon: TrendingUp },
    { href: `${base}/competidores`, label: "Competidores", icon: Radar },
    { href: `${base}/plan`, label: "Plan SEO", icon: ListChecks },
  ];
}

function NavLinks({ clienteId, onNavigate }: { clienteId: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const base = `/admin/clientes/${clienteId}`;
  return (
    <nav className="flex flex-1 flex-col gap-0.5">
      {navItems(clienteId).map((item) => {
        const activo = item.href === base ? pathname === item.href : pathname?.startsWith(item.href);
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

function VolverACartera({ onNavigate, className = "" }: { onNavigate?: () => void; className?: string }) {
  return (
    <Link
      href="/admin"
      onClick={onNavigate}
      className={`flex items-center gap-1.5 px-1 text-xs font-medium text-ink/45 hover:text-accent ${className}`}
    >
      <ArrowLeft size={13} /> Volver a cartera
    </Link>
  );
}

export function AdminClientShell({
  nombreNegocio,
  clienteId,
  children,
}: {
  nombreNegocio: string;
  clienteId: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      {/* Sidebar de escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink/10 bg-white px-4 py-5 md:flex">
        <div className="mb-1 px-1">
          <AibeLogo />
        </div>
        <VolverACartera className="mb-5" />
        <NavLinks clienteId={clienteId} />
        <div className="border-t border-ink/10 pt-3">
          <p className="truncate text-sm font-medium text-ink">{nombreNegocio}</p>
          <p className="truncate text-xs text-ink/40">Vista de administrador</p>
        </div>
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
            <VolverACartera className="mb-4" onNavigate={() => setAbierto(false)} />
            <NavLinks clienteId={clienteId} onNavigate={() => setAbierto(false)} />
          </div>
        </div>
      )}

      <main className="md:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <div className="mb-6 rounded-md border border-accent/25 bg-accent/[0.06] px-4 py-2.5 text-sm text-accent">
            <span className="font-medium">Vista de administrador</span> — estás viendo el panel de{" "}
            {nombreNegocio} como Aibe Technologies. El cliente no ve ni sabe que estás aquí.
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
