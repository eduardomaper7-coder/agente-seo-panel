// Reúne todos los datos reales necesarios para un informe mensual de un
// cliente: posiciones + evolución (Search Console, vía nuestro propio
// historial), competidores, objetivos, trabajo realizado, rendimiento
// técnico (PageSpeed) y tráfico real (Yandex Metrika). Cada fuente que
// todavía no esté configurada se omite (null / vacío) en vez de inventar
// datos — el informe debe reflejar solo lo que sabemos de verdad.
import { createServiceClient } from "@/lib/supabase/server";
import { obtenerPageSpeed, type RendimientoPageSpeed } from "@/lib/pagespeed";
import { obtenerResumenYandex, type ResumenYandexMetrika } from "@/lib/yandex-metrika";

export type DatosInforme = {
  cliente: { id: string; nombre_negocio: string };
  sitio: { dominio: string | null } | null;
  mes: string; // YYYY-MM-01
  mesEtiqueta: string; // "agosto de 2026"
  keywords: {
    termino: string;
    prioridad: number | null;
    posicionInicio: number | null;
    posicionFin: number | null;
  }[];
  competidoresPorKeyword: {
    keyword: string;
    prioridad: number;
    top: { dominio: string; posicion: number | null }[];
  }[];
  objetivos: { pilar: string; descripcion: string; estado: string }[];
  tareasCompletadas: { pilar: string; descripcion: string; evidencia_url: string | null }[];
  pagespeed: RendimientoPageSpeed | null;
  yandex: ResumenYandexMetrika | null;
};

function primerDiaMes(mes: string) {
  return `${mes}-01`;
}

function ultimoDiaMes(mes: string) {
  const [anio, mesNum] = mes.split("-").map(Number);
  const fin = new Date(Date.UTC(anio, mesNum, 0));
  return fin.toISOString().slice(0, 10);
}

export async function reunirDatosInforme(clienteId: string, mes: string): Promise<DatosInforme> {
  const supabase = createServiceClient();
  const inicio = primerDiaMes(mes);
  const fin = ultimoDiaMes(mes);

  const [{ data: cliente }, { data: sitio }, { data: keywords }, { data: competidoresData }, { data: objetivos }, { data: tareas }] =
    await Promise.all([
      supabase.from("clientes").select("id, nombre_negocio").eq("id", clienteId).single(),
      supabase
        .from("sitios_web")
        .select("dominio, gsc_property, yandex_metrika_counter_id")
        .eq("cliente_id", clienteId)
        .maybeSingle(),
      supabase.from("keywords").select("id, termino, prioridad, posicion_actual").eq("cliente_id", clienteId),
      supabase
        .from("competidores")
        .select("dominio, posicion, keywords(termino, prioridad)")
        .eq("cliente_id", clienteId)
        .order("posicion", { ascending: true, nullsFirst: false }),
      supabase.from("objetivos").select("pilar, descripcion, estado").eq("cliente_id", clienteId),
      supabase
        .from("tareas")
        .select("pilar, descripcion, evidencia_url, creado_en")
        .eq("cliente_id", clienteId)
        .eq("estado", "completada")
        .gte("creado_en", inicio)
        .lte("creado_en", `${fin}T23:59:59`),
    ]);

  // Para cada keyword, la posición más antigua registrada dentro del mes es
  // el "inicio"; la más reciente (o posicion_actual si es más nueva) es el
  // "fin" — así se puede mostrar una evolución real, no solo una foto fija.
  const historialPorKeyword = new Map<string, { primera: number | null; ultima: number | null }>();
  if (keywords && keywords.length > 0) {
    const { data: historial } = await supabase
      .from("posiciones_historial")
      .select("keyword_id, posicion, registrado_en")
      .eq("cliente_id", clienteId)
      .gte("registrado_en", inicio)
      .lte("registrado_en", `${fin}T23:59:59`)
      .order("registrado_en", { ascending: true });

    for (const fila of historial ?? []) {
      const actual = historialPorKeyword.get(fila.keyword_id) ?? { primera: null, ultima: null };
      if (actual.primera === null) actual.primera = fila.posicion;
      actual.ultima = fila.posicion;
      historialPorKeyword.set(fila.keyword_id, actual);
    }
  }

  const keywordsInforme = (keywords ?? [])
    .map((k: any) => {
      const h = historialPorKeyword.get(k.id);
      return {
        termino: k.termino,
        prioridad: k.prioridad,
        posicionInicio: h?.primera ?? null,
        posicionFin: k.posicion_actual ?? h?.ultima ?? null,
      };
    })
    .sort((a: any, b: any) => (b.prioridad ?? 0) - (a.prioridad ?? 0));

  const competidoresPlano = (competidoresData ?? [])
    .map((c: any) => {
      const kw = Array.isArray(c.keywords) ? c.keywords[0] : c.keywords;
      return kw ? { keyword: kw.termino, prioridad: kw.prioridad ?? 0, dominio: c.dominio, posicion: c.posicion } : null;
    })
    .filter(Boolean) as { keyword: string; prioridad: number; dominio: string; posicion: number | null }[];

  const competidoresPorKeyword = Object.values(
    competidoresPlano.reduce((acc: Record<string, any>, c) => {
      if (!acc[c.keyword]) acc[c.keyword] = { keyword: c.keyword, prioridad: c.prioridad, top: [] };
      acc[c.keyword].top.push({ dominio: c.dominio, posicion: c.posicion });
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.prioridad - a.prioridad) as DatosInforme["competidoresPorKeyword"];

  const [pagespeed, yandex] = await Promise.all([
    sitio?.dominio ? obtenerPageSpeed(`https://${sitio.dominio}`) : Promise.resolve(null),
    sitio?.yandex_metrika_counter_id
      ? obtenerResumenYandex(sitio.yandex_metrika_counter_id, inicio, fin)
      : Promise.resolve(null),
  ]);

  const mesEtiqueta = new Date(`${inicio}T00:00:00`).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return {
    cliente,
    sitio: sitio ? { dominio: sitio.dominio } : null,
    mes: inicio,
    mesEtiqueta,
    keywords: keywordsInforme,
    competidoresPorKeyword,
    objetivos: objetivos ?? [],
    tareasCompletadas: tareas ?? [],
    pagespeed,
    yandex,
  };
}
