"use client";

import { Info } from "lucide-react";
import { ReactNode } from "react";

// Tooltip ligero, sin dependencias: usa :hover/:focus-within de CSS en vez
// de JS/estado. Pensado para traducir términos técnicos ("posición",
// "SERP"...) a una explicación breve en lenguaje de negocio, sin recargar
// la interfaz — el icono ⓘ es la única pista visual hasta que se interactúa.
export function Tooltip({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <span className="group/tooltip relative inline-flex items-center">
      {children}
      <span tabIndex={0} className="ml-1 inline-flex cursor-help text-ink/30 outline-none hover:text-accent focus:text-accent">
        <Info size={13} strokeWidth={2.25} />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-md bg-ink px-3 py-2 text-xs leading-relaxed text-white opacity-0 shadow-aibe-md transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {text}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink" />
      </span>
    </span>
  );
}
