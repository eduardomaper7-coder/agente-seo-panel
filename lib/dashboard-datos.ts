// Capa única de datos para el panel de cliente (Resumen, Palabras clave,
// Competidores, Plan SEO). Sustituye a la lógica que antes vivía duplicada
// dentro de app/dashboard/page.tsx — mismas tablas, mismas políticas de
// RLS, mismo cliente de Supabase; solo se ha reorganizado para alimentar
// varias páginas y para derivar "posición anterior" / "mejor posición" /
// "cambio" a partir de `posiciones_historial` cuando existe de verdad, en
// vez de inventar una tendencia. Los informes ya no viven aquí: el cliente
// no los ve en su panel, solo el equipo de Aibe Technologies en
// /admin/informes (consulta aparte, ver esa página).
import { cache } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
export type { BadgeEstado } from "@/lib/seo-bandas";
export { clasificarPosicion } from "@/lib/seo-bandas";

export type KeywordDatos = {
  id: string;
  termino: string;
  prioridad: number | null;
  posicionActual: number | null;
  posicionAnterior: number | null; // null si no hay al menos 2 puntos de histórico real
  mejorPosicion: number | null; // null si no hay ningún punto de histórico real
  cambio: number | null; // positivo = ha mejorado (ha subido puestos)
};

export type ObjetivoDatos = {
  id: string;
  pilar: string;
  descripcion: string;
  estado: string;
  plazo: string | null;
};

export type TareaDatos = {
  id: string;
  pilar: string;
  descripcion: string;
  resultado: string | null;
  evidenciaUrl: string | null;
  creadoEn: string;
};

export type CompetidorGrupo = {
  keywordId: string;
  keyword: string;
  prioridad: number;
  top: { dominio: string; posicion: number | null }[];
};

export type CompetidorFrecuente = { dominio: string; apariciones: number };

export type SerieHistorica = {
  fechas: string[]; // ISO, orden ascendente
  keywords: { id: string; termino: string; puntos: (number | null)[] }[];
};

export type DashboardData = {
  demo: boolean;
  cliente: { id: string; nombreNegocio: string };
  email: string | null;
  keywords: KeywordDatos[];
  kpis: {
    totalKeywords: number;
    enTop10: number;
    mejorPosicion: number | null;
    objetivosActivos: number;
    mejoran: number | null;
    bajan: number | null;
  };
  ultimaActualizacion: string | null;
  periodoAnalizado: string;
  hayHistoricoSuficiente: boolean;
  serieHistorica: SerieHistorica | null;
  objetivos: ObjetivoDatos[];
  tareasCompletadas: TareaDatos[];
  competidoresPorKeyword: CompetidorGrupo[];
  competidoresFrecuentes: CompetidorFrecuente[];
};

// Datos de muestra, deliberadamente genéricos y sin sector — el software no
// es solo para un tipo de negocio, así que ni siquiera el estado "sin
// sesión todavía" debe sugerir uno concreto.
const DEMO: DashboardData = {
  demo: true,
  cliente: { id: "demo", nombreNegocio: "Tu negocio" },
  email: null,
  keywords: [
    { id: "d1", termino: "tu servicio principal en tu ciudad", prioridad: 9.2, posicionActual: 6, posicionAnterior: 9, mejorPosicion: 6, cambio: 3 },
    { id: "d2", termino: "tu servicio + zona cercana", prioridad: 8.4, posicionActual: 14, posicionAnterior: 19, mejorPosicion: 14, cambio: 5 },
    { id: "d3", termino: "urgencias / consulta rápida", prioridad: 7.9, posicionActual: 3, posicionAnterior: 3, mejorPosicion: 3, cambio: 0 },
    { id: "d4", termino: "precio de tu servicio", prioridad: 7.1, posicionActual: 22, posicionAnterior: 20, mejorPosicion: 20, cambio: -2 },
    { id: "d5", termino: "opiniones sobre tu negocio", prioridad: 6.5, posicionActual: null, posicionAnterior: null, mejorPosicion: null, cambio: null },
  ],
  kpis: { totalKeywords: 12, enTop10: 5, mejorPosicion: 3, objetivosActivos: 8, mejoran: 3, bajan: 1 },
  ultimaActualizacion: new Date().toISOString(),
  periodoAnalizado: "Últimos 28 días",
  hayHistoricoSuficiente: true,
  serieHistorica: {
    fechas: [
      new Date(Date.now() - 21 * 86400000).toISOString(),
      new Date(Date.now() - 14 * 86400000).toISOString(),
      new Date(Date.now() - 7 * 86400000).toISOString(),
      new Date().toISOString(),
    ],
    keywords: [
      { id: "d1", termino: "tu servicio principal en tu ciudad", puntos: [9, 8, 7, 6] },
      { id: "d2", termino: "tu servicio + zona cercana", puntos: [19, 17, 15, 14] },
      { id: "d3", termino: "urgencias / consulta rápida", puntos: [4, 3, 4, 3] },
    ],
  },
  objetivos: [
    { id: "o1", pilar: "contenido", descripcion: "Crear una página con precios orientativos de tu servicio principal", estado: "activo", plazo: null },
    { id: "o2", pilar: "tecnico", descripcion: "Mejorar la velocidad de carga en móvil", estado: "activo", plazo: null },
    { id: "o3", pilar: "menciones", descripcion: "Alta en directorios locales relevantes para tu sector", estado: "cumplido", plazo: null },
  ],
  tareasCompletadas: [
    { id: "t1", pilar: "tecnico", descripcion: "Configuración de Search Console", resultado: null, evidenciaUrl: null, creadoEn: new Date().toISOString() },
  ],
  competidoresPorKeyword: [
    {
      keywordId: "d1",
      keyword: "tu servicio principal en tu ciudad",
      prioridad: 9.2,
      top: [
        { dominio: "competidor-a.com", posicion: 1 },
        { dominio: "competidor-b.com", posicion: 2 },
        { dominio: "competidor-c.com", posicion: 3 },
      ],
    },
  ],
  competidoresFrecuentes: [
    { dominio: "competidor-a.com", apariciones: 4 },
    { dominio: "competidor-b.com", apariciones: 3 },
  ],
};

// Construye el objeto DashboardData completo a partir de un cliente ya
// resuelto (id + nombre) y del cliente de Supabase que se deba usar para
// las consultas — el de sesión (respeta RLS, panel del propio cliente) o el
// de servicio (se salta RLS, panel interno de la agencia). Así solo hay un
// sitio donde vive la lógica de KPIs/histórico/competidores, tanto si la
// pide el propio cliente como si la pide un administrador.
export async function construirDatos(
  supabase: any,
  cliente: { id: string; nombre_negocio: string },
  email: string | null
): Promise<DashboardData> {
  const [
    { data: keywordsRaw },
    { data: objetivosRaw },
    { data: tareasRaw },
    { data: competidoresRaw },
    { data: historialRaw },
  ]: {
    // `supabase` es `any` a propósito (acepta tanto el cliente de sesión
    // como el de servicio), así que se anota aquí el tipo de cada
    // resultado — si no, todo lo que sale de este Promise.all se vuelve
    // `any` y las llamadas genéricas de más abajo (p. ej. `.reduce<...>`)
    // dejan de compilar.
    data: any[] | null;
  }[] = await Promise.all([
    supabase
      .from("keywords")
      .select("id, termino, prioridad, posicion_actual, actualizado_en")
      .eq("cliente_id", cliente.id)
      .order("prioridad", { ascending: false, nullsFirst: false }),
    supabase.from("objetivos").select("id, pilar, descripcion, estado, plazo").eq("cliente_id", cliente.id),
    supabase
      .from("tareas")
      .select("id, pilar, descripcion, resultado, evidencia_url, creado_en")
      .eq("cliente_id", cliente.id)
      .eq("estado", "completada")
      .order("creado_en", { ascending: false }),
    supabase
      .from("competidores")
      .select("keyword_id, dominio, posicion, keywords(termino, prioridad)")
      .eq("cliente_id", cliente.id)
      .order("posicion", { ascending: true, nullsFirst: false }),
    supabase
      .from("posiciones_historial")
      .select("keyword_id, posicion, registrado_en")
      .eq("cliente_id", cliente.id)
      .order("registrado_en", { ascending: true }),
  ]);

  // --- Histórico por keyword ---
  const historialPorKeyword = new Map<string, { posicion: number | null; registrado_en: string }[]>();
  for (const h of historialRaw ?? []) {
    const lista = historialPorKeyword.get(h.keyword_id) ?? [];
    lista.push({ posicion: h.posicion, registrado_en: h.registrado_en });
    historialPorKeyword.set(h.keyword_id, lista);
  }
  const fechasDistintas = new Set((historialRaw ?? []).map((h: any) => h.registrado_en));
  const hayHistoricoSuficiente = fechasDistintas.size >= 2;

  const keywords: KeywordDatos[] = (keywordsRaw ?? []).map((k: any) => {
    const puntos = historialPorKeyword.get(k.id) ?? [];
    const posicionesHistoricas = puntos.map((p) => p.posicion).filter((p): p is number => p !== null);
    const mejorPosicion = posicionesHistoricas.length > 0 ? Math.min(...posicionesHistoricas) : null;
    const posicionAnterior = puntos.length >= 2 ? puntos[puntos.length - 2].posicion : null;
    const cambio =
      posicionAnterior !== null && k.posicion_actual !== null ? posicionAnterior - k.posicion_actual : null;
    return {
      id: k.id,
      termino: k.termino,
      prioridad: k.prioridad,
      posicionActual: k.posicion_actual,
      posicionAnterior,
      mejorPosicion,
      cambio,
    };
  });

  // --- KPIs ---
  const conCambio = keywords.filter((k) => k.cambio !== null);
  const posicionesActuales = keywords.map((k) => k.posicionActual).filter((p): p is number => p !== null);
  const kpis = {
    totalKeywords: keywords.length,
    enTop10: keywords.filter((k) => k.posicionActual !== null && k.posicionActual <= 10).length,
    mejorPosicion: posicionesActuales.length > 0 ? Math.min(...posicionesActuales) : null,
    objetivosActivos: (objetivosRaw ?? []).filter((o: any) => o.estado === "activo").length,
    mejoran: conCambio.length > 0 ? conCambio.filter((k) => (k.cambio ?? 0) > 0).length : null,
    bajan: conCambio.length > 0 ? conCambio.filter((k) => (k.cambio ?? 0) < 0).length : null,
  };

  const ultimaActualizacion = (keywordsRaw ?? []).reduce<string | null>((max, k: any) => {
    if (!k.actualizado_en) return max;
    return !max || k.actualizado_en > max ? k.actualizado_en : max;
  }, null);

  // --- Serie histórica para la gráfica de evolución (solo si hay >= 2 fechas reales) ---
  let serieHistorica: SerieHistorica | null = null;
  if (hayHistoricoSuficiente) {
    const fechas = [...fechasDistintas].sort();
    const keywordsParaSerie = [...keywords]
      .filter((k) => (historialPorKeyword.get(k.id)?.length ?? 0) > 0)
      .sort((a, b) => (b.prioridad ?? 0) - (a.prioridad ?? 0))
      .slice(0, 6);
    serieHistorica = {
      fechas,
      keywords: keywordsParaSerie.map((k) => {
        const puntosPorFecha = new Map(
          (historialPorKeyword.get(k.id) ?? []).map((p) => [p.registrado_en, p.posicion])
        );
        return { id: k.id, termino: k.termino, puntos: fechas.map((f) => puntosPorFecha.get(f) ?? null) };
      }),
    };
  }

  // --- Competidores ---
  const competidoresPorKeyword: CompetidorGrupo[] = Object.values(
    (competidoresRaw ?? []).reduce((acc: Record<string, CompetidorGrupo>, c: any) => {
      const kw = Array.isArray(c.keywords) ? c.keywords[0] : c.keywords;
      if (!kw) return acc;
      if (!acc[c.keyword_id]) {
        acc[c.keyword_id] = { keywordId: c.keyword_id, keyword: kw.termino, prioridad: kw.prioridad ?? 0, top: [] };
      }
      acc[c.keyword_id].top.push({ dominio: c.dominio, posicion: c.posicion });
      return acc;
    }, {})
  ).sort((a, b) => b.prioridad - a.prioridad);

  const frecuenciaDominios = new Map<string, number>();
  for (const grupo of competidoresPorKeyword) {
    for (const c of grupo.top) {
      frecuenciaDominios.set(c.dominio, (frecuenciaDominios.get(c.dominio) ?? 0) + 1);
    }
  }
  const competidoresFrecuentes: CompetidorFrecuente[] = [...frecuenciaDominios.entries()]
    .map(([dominio, apariciones]) => ({ dominio, apariciones }))
    .sort((a, b) => b.apariciones - a.apariciones)
    .slice(0, 6);

  return {
    demo: false,
    cliente: { id: cliente.id, nombreNegocio: cliente.nombre_negocio },
    email,
    keywords,
    kpis,
    ultimaActualizacion,
    periodoAnalizado: "Últimos 28 días",
    hayHistoricoSuficiente,
    serieHistorica,
    objetivos: (objetivosRaw ?? []).map((o: any) => ({
      id: o.id,
      pilar: o.pilar,
      descripcion: o.descripcion,
      estado: o.estado,
      plazo: o.plazo,
    })),
    tareasCompletadas: (tareasRaw ?? []).map((t: any) => ({
      id: t.id,
      pilar: t.pilar,
      descripcion: t.descripcion,
      resultado: t.resultado,
      evidenciaUrl: t.evidencia_url,
      creadoEn: t.creado_en,
    })),
    competidoresPorKeyword,
    competidoresFrecuentes,
  };
}

// Envuelto con React.cache: el layout del panel y la página activa piden
// ambos estos datos en la misma petición — cache() hace que la segunda
// llamada reutilice la primera en vez de repetir las consultas a Supabase.
// Panel del propio cliente: usa la sesión y respeta RLS, así que cada uno
// solo puede llegar a ver su propia fila en `clientes`.
export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return DEMO;

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre_negocio")
    .eq("auth_user_id", user.id)
    .single();

  if (!cliente) return DEMO;

  return construirDatos(supabase, cliente, user.email ?? null);
});

// Panel interno de la agencia (/admin/clientes/[id]): usa la clave de
// servicio para poder consultar cualquier cliente por id, sin depender de
// con qué usuario haya iniciado sesión quien lo pide — así el equipo de
// Aibe Technologies puede entrar a ver el panel de cualquier negocio de la
// cartera. Devuelve null si el id no corresponde a ningún cliente (404).
export const getDashboardDataById = cache(async (clienteId: string): Promise<DashboardData | null> => {
  const supabase = createServiceClient();

  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, nombre_negocio, contacto_email")
    .eq("id", clienteId)
    .single();

  if (!cliente) return null;

  return construirDatos(supabase, cliente, cliente.contacto_email ?? null);
});

export const PILAR_LABEL: Record<string, string> = {
  contenido: "Contenido",
  menciones: "Menciones",
  tecnico: "SEO técnico",
};

export function labelPilar(pilar: string): string {
  return PILAR_LABEL[pilar] ?? pilar.charAt(0).toUpperCase() + pilar.slice(1);
}
