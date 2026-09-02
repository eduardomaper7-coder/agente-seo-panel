// Cliente mínimo para la API de estadísticas de Yandex Metrika — la
// herramienta de analítica + mapas de calor + grabación de sesiones
// (webvisor) que ya está instalada en la web del cliente y es gratis e
// ilimitada. A diferencia de Search Console, requiere un token OAuth de
// Yandex (YANDEX_METRIKA_TOKEN) que todavía no está configurado; hasta
// entonces esta función devuelve null y el informe simplemente omite esta
// sección en vez de fallar.
const STATS_URL = "https://api-metrika.yandex.net/stat/v1/data";

export type ResumenYandexMetrika = {
  visitas: number;
  paginasVistas: number;
  rebote: number; // %
  duracionMediaSeg: number;
  urlPanel: string; // enlace directo al panel de Yandex Metrika (webvisor / mapas de calor)
};

export async function obtenerResumenYandex(
  counterId: number,
  fechaInicio: string,
  fechaFin: string
): Promise<ResumenYandexMetrika | null> {
  const token = process.env.YANDEX_METRIKA_TOKEN;
  const urlPanel = `https://metrika.yandex.ru/dashboard?id=${counterId}`;
  if (!token) return null;

  try {
    const params = new URLSearchParams({
      ids: String(counterId),
      metrics: "ym:s:visits,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds",
      date1: fechaInicio,
      date2: fechaFin,
    });

    const res = await fetch(`${STATS_URL}?${params.toString()}`, {
      headers: { Authorization: `OAuth ${token}` },
    });
    if (!res.ok) {
      console.error("[yandex] respuesta no OK", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const totales = data?.totals?.[0];
    if (!totales) {
      console.error("[yandex] sin totales en la respuesta", JSON.stringify(data).slice(0, 500));
      return null;
    }

    return {
      visitas: Math.round(totales[0] ?? 0),
      paginasVistas: Math.round(totales[1] ?? 0),
      rebote: Math.round((totales[2] ?? 0) * 10) / 10,
      duracionMediaSeg: Math.round(totales[3] ?? 0),
      urlPanel,
    };
  } catch (err) {
    console.error("[yandex] excepción", (err as Error).message);
    return null;
  }
}
