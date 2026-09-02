import type { KeywordDatos } from "@/lib/dashboard-datos";
import { clasificarPosicion } from "@/lib/seo-bandas";
import { KeywordPositionBadge } from "@/components/ui/KeywordPositionBadge";

const COLOR_BANDA: Record<string, string> = {
  top3: "#1F9D63",
  top10: "#1F9D63",
  top20: "#124FC4",
  top50: "#B45309",
  sin_posicionar: "#0B1B3A",
};

// Cuando todavía no hay suficiente histórico para dibujar una tendencia
// real, esta es la alternativa honesta: una fotografía del estado actual,
// sin fingir una evolución que no podemos demostrar todavía.
export function CurrentStateVisual({ keywords }: { keywords: KeywordDatos[] }) {
  const principales = [...keywords]
    .sort((a, b) => (b.prioridad ?? 0) - (a.prioridad ?? 0))
    .slice(0, 6);

  return (
    <div className="space-y-3">
      {principales.map((k) => {
        const banda = clasificarPosicion(k.posicionActual);
        const pct = k.posicionActual ? Math.max(6, 100 - Math.min(k.posicionActual, 100)) : 3;
        return (
          <div key={k.id} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate text-sm text-ink/70 sm:w-56">{k.termino}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: COLOR_BANDA[banda] }}
              />
            </div>
            <span className="w-16 shrink-0 text-right">
              <KeywordPositionBadge posicion={k.posicionActual} />
            </span>
          </div>
        );
      })}
    </div>
  );
}
