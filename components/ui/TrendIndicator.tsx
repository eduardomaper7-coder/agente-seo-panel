import { ArrowDown, ArrowUp, Minus } from "lucide-react";

// En SEO, "mejorar" es BAJAR el número de posición (acercarse al #1).
// `delta` ya viene calculado como (posición anterior - posición actual):
// un valor positivo significa que subió puestos en el ranking (mejora).
export function TrendIndicator({ delta, compact = false }: { delta: number | null; compact?: boolean }) {
  if (delta === null) {
    return <span className="inline-flex items-center gap-1 text-xs text-ink/35">—</span>;
  }
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-ink/40">
        <Minus size={12} strokeWidth={2.5} />
        {!compact && "Sin cambios"}
      </span>
    );
  }
  const mejora = delta > 0;
  const Icon = mejora ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${mejora ? "text-success" : "text-danger"}`}
    >
      <Icon size={12} strokeWidth={2.75} />
      {Math.abs(delta)}
      {!compact && ` posición${Math.abs(delta) === 1 ? "" : "es"}`}
    </span>
  );
}
