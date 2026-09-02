// Clasificación de una posición de Google en una banda con significado de
// negocio. Vive en un módulo aparte, sin ninguna dependencia de Supabase ni
// de next/headers, precisamente para que los Client Components (como el
// buscador/filtro de la página de Palabras clave) puedan importarla sin
// arrastrar código de servidor a su bundle del navegador.
export type BadgeEstado = "top3" | "top10" | "top20" | "top50" | "sin_posicionar";

export function clasificarPosicion(pos: number | null): BadgeEstado {
  if (pos === null) return "sin_posicionar";
  if (pos <= 3) return "top3";
  if (pos <= 10) return "top10";
  if (pos <= 20) return "top20";
  if (pos <= 50) return "top50";
  return "sin_posicionar";
}
