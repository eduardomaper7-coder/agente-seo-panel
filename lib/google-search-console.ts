// Cliente mínimo para la API de Search Console (solo lectura, scope
// webmasters.readonly). Usa el refresh token generado una vez vía OAuth
// Playground (ver README) para pedir un access token nuevo en cada
// llamada — así no hace falta guardar ni renovar tokens de corta duración
// en ningún sitio, solo las tres credenciales fijas en Vercel.
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SC_BASE = "https://searchconsole.googleapis.com/webmasters/v3";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Faltan credenciales de Search Console (GOOGLE_SEARCH_CONSOLE_CLIENT_ID / GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET / GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN) en las variables de entorno."
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`No se pudo renovar el token de Search Console: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

export type FilaBusquedaGSC = { query: string; position: number; clicks: number; impressions: number };

// Devuelve el rendimiento de búsqueda de los últimos `dias` días, agrupado
// por término de búsqueda (dimensión "query"), para una propiedad de
// Search Console (ej. "sc-domain:dalident.es").
export async function obtenerRendimientoBusqueda(gscProperty: string, dias = 28): Promise<FilaBusquedaGSC[]> {
  const accessToken = await getAccessToken();

  const fin = new Date();
  const inicio = new Date(fin);
  inicio.setDate(inicio.getDate() - dias);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const res = await fetch(`${SC_BASE}/sites/${encodeURIComponent(gscProperty)}/searchAnalytics/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      startDate: fmt(inicio),
      endDate: fmt(fin),
      dimensions: ["query"],
      rowLimit: 1000,
    }),
  });

  if (!res.ok) {
    throw new Error(`Search Console respondió con error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const rows = data.rows ?? [];
  return rows.map((r: any) => ({
    query: r.keys[0],
    position: r.position,
    clicks: r.clicks,
    impressions: r.impressions,
  }));
}

// Normaliza un texto para comparar nuestras keywords propias con las
// queries reales que devuelve Search Console (minúsculas, sin tildes,
// espacios simples) — Google no siempre devuelve el término tal cual lo
// escribimos nosotros en el panel.
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
