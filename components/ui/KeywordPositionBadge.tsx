import { Badge, BadgeTone } from "./Badge";
import { Tooltip } from "./Tooltip";

// Clasifica una posición de Google en una banda con significado de negocio,
// y la traduce siempre al mismo color en todo el panel — nunca un arcoíris.
export function clasificarPosicion(pos: number | null): {
  tono: BadgeTone;
  etiqueta: string;
} {
  if (pos === null) return { tono: "neutral", etiqueta: "No posicionada" };
  if (pos <= 3) return { tono: "success", etiqueta: `#${pos}` };
  if (pos <= 10) return { tono: "success-soft", etiqueta: `#${pos}` };
  if (pos <= 20) return { tono: "info", etiqueta: `#${pos}` };
  if (pos <= 50) return { tono: "warn", etiqueta: `#${pos}` };
  return { tono: "neutral", etiqueta: `#${pos}` };
}

export function KeywordPositionBadge({ posicion }: { posicion: number | null }) {
  const { tono, etiqueta } = clasificarPosicion(posicion);
  if (posicion === null) {
    return (
      <Tooltip text="Actualmente no aparece dentro del rango monitorizado (top 100) para esta búsqueda en Google.">
        <Badge tone={tono}>{etiqueta}</Badge>
      </Tooltip>
    );
  }
  return <Badge tone={tono}>{etiqueta}</Badge>;
}
