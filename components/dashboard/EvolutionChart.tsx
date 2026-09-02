"use client";

import { useMemo, useState } from "react";
import type { SerieHistorica } from "@/lib/dashboard-datos";

const COLORES = ["#124FC4", "#1F9D63", "#B45309", "#7C3AED", "#0891B2", "#D2483B"];

const ALTURA = 240;
const ANCHURA = 640;
const PAD = { top: 16, right: 16, bottom: 28, left: 34 };

// Gráfica de líneas en SVG puro (sin dependencias externas). El eje Y está
// invertido a propósito: la posición #1 (la mejor) se dibuja arriba y los
// números más altos abajo — así "la línea sube" siempre significa "mejora",
// que es como espera leerlo cualquiera que no sepa de SEO.
export function EvolutionChart({ serie }: { serie: SerieHistorica }) {
  const [visibles, setVisibles] = useState<Set<string>>(new Set(serie.keywords.map((k) => k.id)));

  const { yMin, yMax } = useMemo(() => {
    const valores = serie.keywords
      .filter((k) => visibles.has(k.id))
      .flatMap((k) => k.puntos)
      .filter((p): p is number => p !== null);
    if (valores.length === 0) return { yMin: 1, yMax: 20 };
    const min = Math.max(1, Math.min(...valores) - 2);
    const max = Math.max(...valores) + 2;
    return { yMin: min, yMax: max === min ? min + 5 : max };
  }, [serie, visibles]);

  const xStep = serie.fechas.length > 1 ? (ANCHURA - PAD.left - PAD.right) / (serie.fechas.length - 1) : 0;
  const yScale = (pos: number) =>
    PAD.top + ((pos - yMin) / (yMax - yMin)) * (ALTURA - PAD.top - PAD.bottom);
  const xScale = (i: number) => PAD.left + i * xStep;

  function toggle(id: string) {
    setVisibles((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const fmtFecha = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

  // Líneas Y de referencia (rejilla) en posiciones "redondas" dentro del rango.
  const gridLines = useMemo(() => {
    const rango = yMax - yMin;
    const paso = rango > 40 ? 10 : rango > 15 ? 5 : 2;
    const lines: number[] = [];
    for (let v = Math.ceil(yMin / paso) * paso; v <= yMax; v += paso) lines.push(v);
    return lines;
  }, [yMin, yMax]);

  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${ANCHURA} ${ALTURA}`} className="w-full min-w-[420px]" role="img" aria-label="Evolución de posiciones en Google">
          {gridLines.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={ANCHURA - PAD.right}
                y1={yScale(v)}
                y2={yScale(v)}
                stroke="#0B1B3A"
                strokeOpacity={0.06}
              />
              <text x={4} y={yScale(v) + 3} fontSize={10} fill="#0B1B3A" fillOpacity={0.4}>
                #{v}
              </text>
            </g>
          ))}
          {serie.fechas.map((f, i) => (
            <text
              key={f}
              x={xScale(i)}
              y={ALTURA - 8}
              fontSize={10}
              textAnchor="middle"
              fill="#0B1B3A"
              fillOpacity={0.4}
            >
              {fmtFecha(f)}
            </text>
          ))}
          {serie.keywords.map((k, idx) => {
            if (!visibles.has(k.id)) return null;
            const color = COLORES[idx % COLORES.length];
            const segmentos: string[] = [];
            let actual: string[] = [];
            k.puntos.forEach((p, i) => {
              if (p === null) {
                if (actual.length > 1) segmentos.push(actual.join(" "));
                actual = [];
                return;
              }
              actual.push(`${i === 0 || actual.length === 0 ? "M" : "L"}${xScale(i)},${yScale(p)}`);
            });
            if (actual.length > 1) segmentos.push(actual.join(" "));
            return (
              <g key={k.id}>
                {segmentos.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {k.puntos.map((p, i) =>
                  p === null ? null : <circle key={i} cx={xScale(i)} cy={yScale(p)} r={2.75} fill={color} />
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {serie.keywords.map((k, idx) => {
          const color = COLORES[idx % COLORES.length];
          const activo = visibles.has(k.id);
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => toggle(k.id)}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${activo ? "opacity-100" : "opacity-35"}`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-ink/70">{k.termino}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
