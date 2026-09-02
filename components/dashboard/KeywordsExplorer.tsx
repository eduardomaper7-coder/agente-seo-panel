"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { KeywordDatos } from "@/lib/dashboard-datos";
import { clasificarPosicion } from "@/lib/seo-bandas";
import { KeywordPositionBadge } from "@/components/ui/KeywordPositionBadge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { EmptyState } from "@/components/ui/EmptyState";

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "top3", label: "Top 3" },
  { id: "top10", label: "Top 10" },
  { id: "top20", label: "11-20" },
  { id: "top50", label: "21-50" },
  { id: "sin_posicionar", label: "No posicionada" },
] as const;

// Tabla + buscador/filtro de palabras clave. Las columnas de histórico
// (posición anterior, cambio, mejor posición) solo se muestran cuando de
// verdad hay datos suficientes — el mismo criterio que ya aplica el resto
// del panel, para no sugerir una tendencia que no podemos demostrar.
export function KeywordsExplorer({
  keywords,
  hayHistoricoSuficiente,
}: {
  keywords: KeywordDatos[];
  hayHistoricoSuficiente: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todas");

  const filtradas = useMemo(() => {
    return keywords
      .filter((k) => k.termino.toLowerCase().includes(busqueda.trim().toLowerCase()))
      .filter((k) => filtro === "todas" || clasificarPosicion(k.posicionActual) === filtro)
      .sort((a, b) => (b.prioridad ?? 0) - (a.prioridad ?? 0));
  }, [keywords, busqueda, filtro]);

  if (keywords.length === 0) {
    return <EmptyState icon={Search} title="Todavía no hay palabras clave cargadas" description="En cuanto se den de alta para tu negocio, aparecerán aquí." />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar palabra clave…"
            className="w-full rounded-md border border-ink/12 bg-white py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink/35 outline-none focus:border-accent focus:ring-1 focus:ring-accent/30"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtro === f.id ? "bg-accent text-white" : "bg-ink/[0.05] text-ink/55 hover:bg-ink/[0.09]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState icon={Search} title="Ninguna palabra clave coincide con la búsqueda" description="Prueba con otro término o quita los filtros." />
      ) : (
        <>
          {/* Tabla — escritorio / tablet */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/[0.08] text-xs text-ink/40">
                  <th className="py-2 pr-3 font-medium">Palabra clave</th>
                  <th className="py-2 px-3 font-medium">Posición actual</th>
                  {hayHistoricoSuficiente && <th className="py-2 px-3 font-medium">Posición anterior</th>}
                  {hayHistoricoSuficiente && <th className="py-2 px-3 font-medium">Cambio</th>}
                  {hayHistoricoSuficiente && <th className="py-2 px-3 font-medium">Mejor posición</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {filtradas.map((k) => (
                  <tr key={k.id}>
                    <td className="py-3 pr-3 text-ink">{k.termino}</td>
                    <td className="py-3 px-3">
                      <KeywordPositionBadge posicion={k.posicionActual} />
                    </td>
                    {hayHistoricoSuficiente && (
                      <td className="py-3 px-3 text-ink/60">{k.posicionAnterior !== null ? `#${k.posicionAnterior}` : "—"}</td>
                    )}
                    {hayHistoricoSuficiente && (
                      <td className="py-3 px-3">
                        <TrendIndicator delta={k.cambio} />
                      </td>
                    )}
                    {hayHistoricoSuficiente && (
                      <td className="py-3 px-3 text-ink/60">{k.mejorPosicion !== null ? `#${k.mejorPosicion}` : "—"}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista de tarjetas — móvil */}
          <div className="space-y-2.5 sm:hidden">
            {filtradas.map((k) => (
              <div key={k.id} className="rounded-lg border border-ink/[0.08] p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-sm text-ink">{k.termino}</span>
                  <KeywordPositionBadge posicion={k.posicionActual} />
                </div>
                {hayHistoricoSuficiente && (
                  <div className="flex items-center justify-between text-xs text-ink/50">
                    <span>Antes: {k.posicionAnterior !== null ? `#${k.posicionAnterior}` : "—"}</span>
                    <span>Mejor: {k.mejorPosicion !== null ? `#${k.mejorPosicion}` : "—"}</span>
                    <TrendIndicator delta={k.cambio} compact />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
