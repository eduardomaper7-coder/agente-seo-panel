// Cliente mínimo para PageSpeed Insights API (gratis, solo necesita una
// clave de API — a diferencia de Search Console no hace falta OAuth).
// Devuelve null en vez de lanzar error cuando falta la clave o la llamada
// falla, para que el informe mensual se genere igualmente sin esta sección
// en vez de romperse por completo.
const PAGESPEED_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export type RendimientoPageSpeed = {
  puntuacionMovil: number | null;
  lcp: string | null;
  cls: string | null;
  inp: string | null;
};

export async function obtenerPageSpeed(url: string): Promise<RendimientoPageSpeed | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `${PAGESPEED_URL}?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile&category=performance`
    );
    if (!res.ok) {
      console.error("[pagespeed] respuesta no OK", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const categoria = data?.lighthouseResult?.categories?.performance?.score;
    const metricas = data?.loadingExperience?.metrics ?? data?.lighthouseResult?.audits ?? {};

    const lcpMs =
      data?.loadingExperience?.metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ??
      data?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue;
    const cls =
      data?.loadingExperience?.metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile ??
      data?.lighthouseResult?.audits?.["cumulative-layout-shift"]?.numericValue;
    const inpMs =
      data?.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile ?? null;

    return {
      puntuacionMovil: typeof categoria === "number" ? Math.round(categoria * 100) : null,
      lcp: lcpMs ? `${(lcpMs / 1000).toFixed(1)}s` : null,
      cls: cls ? (cls / (cls > 10 ? 100 : 1)).toFixed(2) : null,
      inp: inpMs ? `${(inpMs / 1000).toFixed(2)}s` : null,
    };
  } catch (err) {
    console.error("[pagespeed] excepción", (err as Error).message);
    return null;
  }
}
