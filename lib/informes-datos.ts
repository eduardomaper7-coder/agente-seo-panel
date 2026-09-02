// Reúne todos los datos reales necesarios para el informe mensual en PDF de
// un cliente. Deliberadamente NO reimplementa el cálculo de KPIs/histórico/
// competidores: reutiliza construirDatos() de lib/dashboard-datos.ts — la
// misma función que alimenta el panel web — para que el informe muestre
// siempre los mismos números que el dashboard (misma "mejor posición",
// mismos "keywords que mejoran", mismo ranking de competidores frecuentes).
// A partir de ahí solo añade lo que es propio del informe mensual: qué
// tareas se completaron dentro del mes concreto del informe, rendimiento
// técnico (PageSpeed) y tráfico real (Yandex Metrika). Cada fuente que
// todavía no esté configurada se omite (null / vacío) en vez de inventar
// datos — el informe debe reflejar solo lo que sabemos de verdad.
import { createServiceClient } from "@/lib/supabase/server";
import {
  construirDatos,
  type KeywordDatos,
  type ObjetivoDatos,
  type TareaDatos,
  type CompetidorGrupo,
  type CompetidorFrecuente,
  type SerieHistorica,
} from "@/lib/dashboard-datos";
import { obtenerPageSpeed, type RendimientoPageSpeed } from "@/lib/pagespeed";
import { obtenerResumenYandex, type ResumenYandexMetrika } from "@/lib/yandex-metrika";

export type DatosInforme = {
  cliente: { id: string; nombre_negocio: string; logo_url: string | null };
  sitio: { dominio: string | null } | null;
  mes: string; // YYYY-MM-01
  mesEtiqueta: string; // "agosto de 2026"
  keywords: KeywordDatos[];
  kpis: {
    totalKeywords: number;
    enTop10: number;
    mejorPosicion: number | null;
    objetivosActivos: number;
    mejoran: number | null;
    bajan: number | null;
  };
  hayHistoricoSuficiente: boolean;
  serieHistorica: SerieHistorica | null;
  competidoresPorKeyword: CompetidorGrupo[];
  competidoresFrecuentes: CompetidorFrecuente[];
  objetivos: ObjetivoDatos[];
  // Solo las tareas completadas dentro del mes concreto de este informe —
  // distinto de dashboard-datos.tareasCompletadas, que es el histórico
  // completo usado en el panel.
  tareasCompletadasMes: TareaDatos[];
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

export async function reunirDatosInforme(clienteId: string, mes: string): Promise<DatosInforme | null> {
  const supabase = createServiceClient();
  const inicio = primerDiaMes(mes);
  const fin = ultimoDiaMes(mes);

  const [{ data: cliente }, { data: sitio }] = await Promise.all([
    supabase.from("clientes").select("id, nombre_negocio, contacto_email, logo_url").eq("id", clienteId).single(),
    supabase
      .from("sitios_web")
      .select("dominio, gsc_property, yandex_metrika_counter_id")
      .eq("cliente_id", clienteId)
      .maybeSingle(),
  ]);

  if (!cliente) return null;

  // Misma lógica exacta que el panel: KPIs, histórico real, competidores y
  // el ranking de competidores más frecuentes — así el informe nunca
  // muestra un número distinto al que el cliente ve en su dashboard.
  const datosPanel = await construirDatos(supabase, cliente, cliente.contacto_email ?? null);

  const tareasCompletadasMes = datosPanel.tareasCompletadas.filter(
    (t) => t.creadoEn >= inicio && t.creadoEn <= `${fin}T23:59:59`
  );

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
    cliente: { id: cliente.id, nombre_negocio: cliente.nombre_negocio, logo_url: cliente.logo_url ?? null },
    sitio: sitio ? { dominio: sitio.dominio } : null,
    mes: inicio,
    mesEtiqueta,
    keywords: datosPanel.keywords,
    kpis: datosPanel.kpis,
    hayHistoricoSuficiente: datosPanel.hayHistoricoSuficiente,
    serieHistorica: datosPanel.serieHistorica,
    competidoresPorKeyword: datosPanel.competidoresPorKeyword,
    competidoresFrecuentes: datosPanel.competidoresFrecuentes,
    objetivos: datosPanel.objetivos,
    tareasCompletadasMes,
    pagespeed,
    yandex,
  };
}
