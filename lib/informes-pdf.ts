// Genera el PDF del informe mensual con @react-pdf/renderer (renderiza en
// Node, sin necesidad de un navegador headless — encaja bien en una función
// serverless de Vercel). Usa React.createElement en vez de JSX porque este
// archivo no es .tsx (los route handlers de Next viven en route.ts).
//
// Diseño alineado con el panel web (mismos colores de tailwind.config.ts,
// mismas bandas de posición de lib/seo-bandas.ts, mismos KPIs de
// lib/dashboard-datos.ts) para que el informe se sienta como "la versión en
// PDF del dashboard", no como un producto aparte.
//
// La tipografía (Inter) y el logotipo de Aibe Technologies se leen del
// disco (public/fonts, public/brand) en vez de descargarse en cada
// generación — más fiable en una función serverless que depender de una
// petición de red a mitad del render (ver next.config.js:
// outputFileTracingIncludes). El logo de cada cliente, en cambio, si existe
// (lib/informes-datos.ts → clientes.logo_url), sí se carga por URL: es un
// dato propio de cada negocio, no de la app.
import fs from "fs";
import path from "path";
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Svg,
  Path,
  Circle,
  Polyline,
  Rect,
  Image,
  Link,
  Font,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { DatosInforme } from "@/lib/informes-datos";
import { clasificarPosicion, labelPilar, type BadgeEstado } from "@/lib/dashboard-datos";

const h = React.createElement;

// ---------------------------------------------------------------------------
// Marca — misma paleta que tailwind.config.ts (panel web) para que el PDF y
// el dashboard se perciban como el mismo producto.
// ---------------------------------------------------------------------------
const AZUL_AIBE = "#124FC4";
const AZUL_MARINO = "#0B1B3A";
const AZUL_CLARO = "#EEF3FE";
const FONDO = "#F7F9FC";
const BLANCO = "#FFFFFF";
const TEXTO = "#0F172A";
const TEXTO_SEC = "#64748B";
const TEXTO_TERCIARIO = "#94A3B8";
const BORDE = "#E2E8F0";
const BORDE_SUAVE = "#EDF1F7";
const VERDE = "#1F9D63";
const VERDE_CLARO = "#E9F7F0";
const ROJO = "#D2483B";
const ROJO_CLARO = "#FBECEA";
const AMBAR = "#B45309";
const AMBAR_CLARO = "#FCF1E1";
const GRIS_BADGE = "#F1F5F9";

// Paleta de líneas de la gráfica de evolución — idéntica a
// components/dashboard/EvolutionChart.tsx (panel web) para que un cliente
// que mira ambos vea las mismas keywords con el mismo color.
const COLORES_SERIE = ["#124FC4", "#1F9D63", "#B45309", "#7C3AED", "#0891B2", "#D2483B"];

// ---------------------------------------------------------------------------
// Tipografía — Inter embebida desde disco (public/fonts). Si por lo que sea
// faltasen los archivos (entorno local sin el repo completo, etc.) se cae
// a Helvetica en vez de romper la generación del informe.
// ---------------------------------------------------------------------------
const FONT_DIR = path.join(process.cwd(), "public", "fonts");
let FUENTE_BASE = "Helvetica";
let FUENTE_BOLD_DISPONIBLE = false;
try {
  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(FONT_DIR, "Inter-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Inter-Medium.ttf"), fontWeight: 500 },
      { src: path.join(FONT_DIR, "Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // Sin esto, una palabra normal de texto corrido nunca se parte (evita
  // guiones de separación silábica feos en medio de una frase) — PERO un
  // dominio largo sin espacios (frecuente en "Competencia") sí necesita
  // poder ajustarse a varias líneas dentro de su tarjeta en vez de
  // desbordarla. Como los dominios ya traen sus propios separadores
  // naturales (. y -), solo se ofrecen esos puntos de corte cuando existen.
  Font.registerHyphenationCallback((word) => {
    if (!/[.-]/.test(word)) return [word];
    return word.split(/(?<=[.-])/).filter(Boolean);
  });
  FUENTE_BASE = "Inter";
  FUENTE_BOLD_DISPONIBLE = true;
} catch (err) {
  console.error("[informes-pdf] No se pudo registrar Inter, usando Helvetica de reserva.", (err as Error).message);
}

const PESO_REGULAR = FUENTE_BOLD_DISPONIBLE ? 400 : undefined;
const PESO_MEDIO = FUENTE_BOLD_DISPONIBLE ? 500 : undefined;
const PESO_SEMI = FUENTE_BOLD_DISPONIBLE ? 600 : undefined;
const PESO_BOLD = FUENTE_BOLD_DISPONIBLE ? 700 : undefined;
const FF_BOLD = FUENTE_BOLD_DISPONIBLE ? FUENTE_BASE : "Helvetica-Bold";

// ---------------------------------------------------------------------------
// Logo de Aibe Technologies — leído una sola vez del disco como Buffer
// (evita otra petición de red durante la generación).
// ---------------------------------------------------------------------------
let LOGO_AIBE: Buffer | null = null;
try {
  LOGO_AIBE = fs.readFileSync(path.join(process.cwd(), "public", "brand", "aibe-logo.png"));
} catch (err) {
  console.error("[informes-pdf] No se pudo leer public/brand/aibe-logo.png", (err as Error).message);
}
const LOGO_RATIO = 1038 / 427;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
const PAGINA = { width: 595.28, height: 841.89 };
const MARGEN = { top: 50, bottom: 58, left: 44, right: 44 };
const CONTENT_W = PAGINA.width - MARGEN.left - MARGEN.right;

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGEN.top,
    paddingBottom: MARGEN.bottom,
    paddingLeft: MARGEN.left,
    paddingRight: MARGEN.right,
    fontFamily: FUENTE_BASE,
    fontSize: 9.5,
    color: TEXTO,
    backgroundColor: BLANCO,
  },
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  cabeceraTextos: { flexDirection: "column" },
  cabeceraEyebrow: { fontSize: 7.5, color: TEXTO_TERCIARIO, letterSpacing: 1.2, fontWeight: PESO_SEMI as any },
  cabeceraCliente: { fontSize: 9.5, color: AZUL_MARINO, fontWeight: PESO_SEMI as any, marginTop: 1 },
  eyebrow: {
    fontSize: 8.5,
    color: AZUL_AIBE,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: PESO_SEMI as any,
    marginBottom: 5,
  },
  h1: { fontSize: 19, color: AZUL_MARINO, fontWeight: PESO_BOLD as any, fontFamily: FF_BOLD, marginBottom: 4 },
  subtitulo: { fontSize: 10, color: TEXTO_SEC, marginBottom: 20, maxWidth: 380 },
  footer: {
    position: "absolute",
    bottom: 26,
    left: MARGEN.left,
    right: MARGEN.right,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 0.75,
    borderTopColor: BORDE_SUAVE,
    paddingTop: 8,
  },
  footerTexto: { fontSize: 7.5, color: TEXTO_TERCIARIO },
});

// =============================================================================
// Iconos — geometría tomada de lucide-react (misma librería de iconos que ya
// usa el panel web, ver components/**), redibujada con los primitivos SVG de
// @react-pdf/renderer. Trazo, no relleno — mismo lenguaje visual minimalista.
// =============================================================================
type NodoIcono =
  | { t: "path"; d: string }
  | { t: "circle"; cx: number; cy: number; r: number }
  | { t: "polyline"; points: string }
  | { t: "rect"; x: number; y: number; width: number; height: number; rx?: number };

const ICONOS: Record<string, NodoIcono[]> = {
  search: [
    { t: "circle", cx: 11, cy: 11, r: 8 },
    { t: "path", d: "m21 21-4.3-4.3" },
  ],
  award: [
    {
      t: "path",
      d: "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
    },
    { t: "circle", cx: 12, cy: 8, r: 6 },
  ],
  trendingUp: [
    { t: "polyline", points: "22 7 13.5 15.5 8.5 10.5 2 17" },
    { t: "polyline", points: "16 7 22 7 22 13" },
  ],
  trendingDown: [
    { t: "polyline", points: "22 17 13.5 8.5 8.5 13.5 2 7" },
    { t: "polyline", points: "16 17 22 17 22 11" },
  ],
  target: [
    { t: "circle", cx: 12, cy: 12, r: 10 },
    { t: "circle", cx: 12, cy: 12, r: 6 },
    { t: "circle", cx: 12, cy: 12, r: 2 },
  ],
  users: [
    { t: "path", d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" },
    { t: "circle", cx: 9, cy: 7, r: 4 },
    { t: "path", d: "M22 21v-2a4 4 0 0 0-3-3.87" },
    { t: "path", d: "M16 3.13a4 4 0 0 1 0 7.75" },
  ],
  smartphone: [
    { t: "rect", x: 5, y: 2, width: 14, height: 20, rx: 2 },
    { t: "path", d: "M12 18h.01" },
  ],
  gauge: [
    { t: "path", d: "m12 14 4-4" },
    { t: "path", d: "M3.34 19a10 10 0 1 1 17.32 0" },
  ],
  clipboardList: [
    { t: "rect", x: 8, y: 2, width: 8, height: 4, rx: 1 },
    { t: "path", d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" },
    { t: "path", d: "M12 11h4" },
    { t: "path", d: "M12 16h4" },
    { t: "path", d: "M8 11h.01" },
    { t: "path", d: "M8 16h.01" },
  ],
  checkCircle: [
    { t: "circle", cx: 12, cy: 12, r: 10 },
    { t: "path", d: "m9 12 2 2 4-4" },
  ],
  arrowUp: [
    { t: "path", d: "m5 12 7-7 7 7" },
    { t: "path", d: "M12 19V5" },
  ],
  arrowDown: [
    { t: "path", d: "M12 5v14" },
    { t: "path", d: "m19 12-7 7-7-7" },
  ],
  minus: [{ t: "path", d: "M5 12h14" }],
  activity: [
    {
      t: "path",
      d: "M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",
    },
  ],
  fileCheck: [
    { t: "path", d: "M4 21.4V4.6A1.6 1.6 0 0 1 5.6 3h8.03a1.6 1.6 0 0 1 1.13.47l3.77 3.77a1.6 1.6 0 0 1 .47 1.13V21.4a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 21.4Z" },
    { t: "path", d: "m9 15 2 2 4-4" },
  ],
};

function Icono(
  nombre: keyof typeof ICONOS,
  { size = 12, color = AZUL_MARINO, strokeWidth = 2 }: { size?: number; color?: string; strokeWidth?: number } = {}
) {
  const nodos = ICONOS[nombre] ?? [];
  return h(
    Svg,
    { width: size, height: size, viewBox: "0 0 24 24" },
    ...nodos.map((n, i) => {
      const comunes = { key: i, fill: "none", stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
      if (n.t === "path") return h(Path, { ...comunes, d: n.d });
      if (n.t === "circle") return h(Circle, { ...comunes, cx: n.cx, cy: n.cy, r: n.r });
      if (n.t === "polyline") return h(Polyline, { ...comunes, points: n.points });
      return h(Rect, { ...comunes, x: n.x, y: n.y, width: n.width, height: n.height, rx: n.rx ?? 0 });
    })
  );
}

// =============================================================================
// Bandas de posición — mismos umbrales que lib/seo-bandas.ts (panel web),
// con etiqueta de texto además del color, para la columna "Estado" del PDF.
// =============================================================================
const BANDA_INFO: Record<BadgeEstado, { etiqueta: string; bg: string; fg: string }> = {
  top3: { etiqueta: "TOP 3", bg: VERDE_CLARO, fg: VERDE },
  top10: { etiqueta: "TOP 10", bg: VERDE_CLARO, fg: VERDE },
  top20: { etiqueta: "TOP 20", bg: AZUL_CLARO, fg: AZUL_AIBE },
  top50: { etiqueta: "TOP 50", bg: AMBAR_CLARO, fg: AMBAR },
  sin_posicionar: { etiqueta: "SIN POSICIÓN", bg: GRIS_BADGE, fg: TEXTO_SEC },
};

function bandaDe(pos: number | null) {
  return BANDA_INFO[clasificarPosicion(pos)];
}

function EstadoBadge(pos: number | null) {
  const b = bandaDe(pos);
  return h(
    View,
    { style: { alignSelf: "flex-start", backgroundColor: b.bg, borderRadius: 4, paddingVertical: 2.5, paddingHorizontal: 7 } },
    h(Text, { style: { fontSize: 7, fontWeight: PESO_SEMI as any, color: b.fg, letterSpacing: 0.3 } }, b.etiqueta)
  );
}

const ESTADO_OBJETIVO: Record<string, { etiqueta: string; bg: string; fg: string }> = {
  activo: { etiqueta: "EN CURSO", bg: AZUL_CLARO, fg: AZUL_AIBE },
  cumplido: { etiqueta: "COMPLETADO", bg: VERDE_CLARO, fg: VERDE },
  revisado: { etiqueta: "REVISADO", bg: GRIS_BADGE, fg: TEXTO_SEC },
  pausado: { etiqueta: "PENDIENTE", bg: GRIS_BADGE, fg: TEXTO_SEC },
};

function EstadoObjetivoBadge(estado: string) {
  const b = ESTADO_OBJETIVO[estado] ?? { etiqueta: estado.toUpperCase(), bg: GRIS_BADGE, fg: TEXTO_SEC };
  return h(
    View,
    { style: { alignSelf: "flex-start", backgroundColor: b.bg, borderRadius: 4, paddingVertical: 2.5, paddingHorizontal: 7 } },
    h(Text, { style: { fontSize: 6.75, fontWeight: PESO_SEMI as any, color: b.fg, letterSpacing: 0.3 } }, b.etiqueta)
  );
}

// Cambio de posición: positivo = ha mejorado (ha subido puestos = número
// más bajo). null = sin histórico con el que comparar (nunca "sin cambio").
function CambioIndicador(cambio: number | null) {
  if (cambio === null) {
    return h(Text, { style: { fontSize: 8.5, color: TEXTO_TERCIARIO } }, "No disponible");
  }
  if (cambio === 0) {
    return h(Text, { style: { fontSize: 9, color: TEXTO_SEC } }, "—");
  }
  const mejora = cambio > 0;
  return h(
    View,
    { style: { flexDirection: "row", alignItems: "center", gap: 3, justifyContent: "center" } },
    Icono(mejora ? "arrowUp" : "arrowDown", { size: 8, color: mejora ? VERDE : ROJO, strokeWidth: 3 }),
    h(Text, { style: { fontSize: 9, fontWeight: PESO_SEMI as any, color: mejora ? VERDE : ROJO } }, String(Math.abs(cambio)))
  );
}

// =============================================================================
// Cabecera de página (compacta, se repite en las páginas de contenido) y pie
// de página (una sola línea discreta, numeración automática).
// =============================================================================
function CabeceraPagina(clienteNombre: string) {
  return h(
    View,
    { style: styles.cabecera, fixed: true },
    LOGO_AIBE
      ? h(Image, { src: LOGO_AIBE, style: { height: 15, width: 15 * LOGO_RATIO } })
      : h(Text, { style: { fontSize: 11, fontWeight: PESO_BOLD as any, color: AZUL_MARINO } }, "Aibe Technologies"),
    h(
      View,
      { style: [styles.cabeceraTextos, { alignItems: "flex-end" }] },
      h(Text, { style: styles.cabeceraEyebrow }, "INFORME SEO MENSUAL"),
      h(Text, { style: styles.cabeceraCliente }, clienteNombre)
    )
  );
}

function PiePagina(mesEtiqueta: string) {
  return h(
    View,
    { style: styles.footer, fixed: true },
    h(Text, { style: styles.footerTexto }, "Aibe Technologies · aibetech.es"),
    h(Text, { style: styles.footerTexto }, `Informe SEO · ${capitalizar(mesEtiqueta)}`),
    h(Text, {
      style: styles.footerTexto,
      render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        `${String(pageNumber).padStart(2, "0")} / ${String(totalPages).padStart(2, "0")}`,
    })
  );
}

function SeccionTitulo(eyebrow: string, titulo: string, subtitulo?: string) {
  return h(
    View,
    null,
    h(Text, { style: styles.eyebrow }, eyebrow),
    h(Text, { style: styles.h1 }, titulo),
    subtitulo ? h(Text, { style: styles.subtitulo }, subtitulo) : null
  );
}

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// =============================================================================
// KPI tiles (fila de tarjetas del resumen ejecutivo)
// =============================================================================
function KpiTile(opts: {
  label: string;
  valor: string;
  icono?: keyof typeof ICONOS;
  colorValor?: string;
  ancho?: number;
}) {
  const { label, valor, icono, colorValor = AZUL_MARINO, ancho } = opts;
  return h(
    View,
    {
      style: {
        flexGrow: 1,
        flexBasis: ancho ?? 0,
        minWidth: ancho ?? 108,
        backgroundColor: FONDO,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: BORDE_SUAVE,
        padding: 12,
      },
    },
    icono
      ? h(
          View,
          {
            style: {
              position: "absolute",
              top: 10,
              right: 10,
              width: 20,
              height: 20,
              borderRadius: 5,
              backgroundColor: AZUL_CLARO,
              alignItems: "center",
              justifyContent: "center",
            },
          },
          Icono(icono, { size: 11, color: AZUL_AIBE, strokeWidth: 2.25 })
        )
      : null,
    h(
      Text,
      { style: { fontSize: 6.75, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 9, paddingRight: icono ? 26 : 0 } },
      label
    ),
    h(Text, { style: { fontSize: 19, fontWeight: PESO_BOLD as any, fontFamily: FF_BOLD, color: colorValor } }, valor)
  );
}

// =============================================================================
// Generación de insights del resumen ejecutivo — solo a partir de datos
// reales ya calculados; nunca se inventa una conclusión.
// =============================================================================
function generarInsights(datos: DatosInforme): string[] {
  const insights: string[] = [];
  const { kpis, keywords, pagespeed, tareasCompletadasMes } = datos;

  if (kpis.enTop10 > 0) {
    insights.push(
      `${kpis.enTop10} palabra${kpis.enTop10 === 1 ? "" : "s"} clave ya ${kpis.enTop10 === 1 ? "aparece" : "aparecen"} entre los primeros 10 resultados de Google.`
    );
  }
  if (kpis.mejorPosicion !== null) {
    const mejor = [...keywords].filter((k) => k.posicionActual === kpis.mejorPosicion)[0];
    insights.push(
      `La mejor posición registrada este mes es #${kpis.mejorPosicion}${mejor ? ` (“${mejor.termino}”)` : ""}.`
    );
  }
  if (kpis.mejoran !== null && kpis.mejoran > 0) {
    insights.push(`${kpis.mejoran} palabra${kpis.mejoran === 1 ? "" : "s"} clave ${kpis.mejoran === 1 ? "ha mejorado" : "han mejorado"} de posición recientemente.`);
  }
  if (pagespeed?.puntuacionMovil !== null && pagespeed?.puntuacionMovil !== undefined && pagespeed.puntuacionMovil < 90) {
    insights.push(
      `La velocidad móvil (${pagespeed.puntuacionMovil}/100) es actualmente uno de los puntos de mejora de la web.`
    );
  }
  if (tareasCompletadasMes.length > 0) {
    insights.push(`Se ${tareasCompletadasMes.length === 1 ? "ha completado" : "han completado"} ${tareasCompletadasMes.length} acción${tareasCompletadasMes.length === 1 ? "" : "es"} SEO este mes.`);
  }
  if (kpis.objetivosActivos > 0) {
    insights.push(`Hay ${kpis.objetivosActivos} acción${kpis.objetivosActivos === 1 ? "" : "es"} SEO en ejecución ahora mismo.`);
  }

  return insights.slice(0, 4);
}

// Estados de rendimiento técnico según los umbrales oficiales de Core Web
// Vitals / Lighthouse (web.dev) — no son un criterio inventado para este
// informe, son el estándar que usa la propia PageSpeed Insights.
function estadoPuntuacion(v: number): { etiqueta: string; color: string } {
  if (v >= 90) return { etiqueta: "Excelente", color: VERDE };
  if (v >= 50) return { etiqueta: "Mejorable", color: AMBAR };
  return { etiqueta: "Necesita mejorar", color: ROJO };
}
function estadoLCP(segundos: number): { etiqueta: string; color: string } {
  if (segundos <= 2.5) return { etiqueta: "Excelente", color: VERDE };
  if (segundos <= 4) return { etiqueta: "Mejorable", color: AMBAR };
  return { etiqueta: "Necesita mejorar", color: ROJO };
}
function estadoCLS(valor: number): { etiqueta: string; color: string } {
  if (valor <= 0.1) return { etiqueta: "Excelente", color: VERDE };
  if (valor <= 0.25) return { etiqueta: "Mejorable", color: AMBAR };
  return { etiqueta: "Necesita mejorar", color: ROJO };
}

function TarjetaTecnica(opts: { label: string; valor: string; estado?: { etiqueta: string; color: string }; explicacion: string }) {
  return h(
    View,
    { style: { flexGrow: 1, flexBasis: 150, minWidth: 150, backgroundColor: BLANCO, borderWidth: 1, borderColor: BORDE, borderRadius: 10, padding: 13 } },
    h(Text, { style: { fontSize: 6.75, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 8 } }, opts.label),
    h(Text, { style: { fontSize: 18, fontWeight: PESO_BOLD as any, fontFamily: FF_BOLD, color: AZUL_MARINO, marginBottom: 5 } }, opts.valor),
    opts.estado
      ? h(Text, { style: { fontSize: 8, fontWeight: PESO_SEMI as any, color: opts.estado.color, marginBottom: 7 } }, opts.estado.etiqueta)
      : null,
    h(Text, { style: { fontSize: 7.5, color: TEXTO_TERCIARIO, lineHeight: 1.35 } }, opts.explicacion)
  );
}

// =============================================================================
// Gráfica de evolución de posiciones — SVG dibujado a mano, eje Y invertido
// (posición #1 arriba) para que "la línea sube" siempre signifique "mejora".
// Misma lógica que components/dashboard/EvolutionChart.tsx (panel web).
// =============================================================================
function GraficaEvolucion(serie: NonNullable<DatosInforme["serieHistorica"]>) {
  const ANCHO = CONTENT_W;
  const ALTO = 168;
  const PAD = { top: 10, right: 8, bottom: 20, left: 26 };

  const valores = serie.keywords.flatMap((k) => k.puntos).filter((p): p is number => p !== null);
  if (valores.length === 0) return null;
  const yMin = Math.max(1, Math.min(...valores) - 2);
  const yMaxRaw = Math.max(...valores) + 2;
  const yMax = yMaxRaw === yMin ? yMin + 5 : yMaxRaw;

  const xStep = serie.fechas.length > 1 ? (ANCHO - PAD.left - PAD.right) / (serie.fechas.length - 1) : 0;
  const yScale = (pos: number) => PAD.top + ((pos - yMin) / (yMax - yMin)) * (ALTO - PAD.top - PAD.bottom);
  const xScale = (i: number) => PAD.left + i * xStep;

  const rango = yMax - yMin;
  const paso = rango > 40 ? 10 : rango > 15 ? 5 : 2;
  const lineasGrid: number[] = [];
  for (let v = Math.ceil(yMin / paso) * paso; v <= yMax; v += paso) lineasGrid.push(v);

  const fmtF = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });

  const lineas = serie.keywords.map((k, idx) => {
    const color = COLORES_SERIE[idx % COLORES_SERIE.length];
    const puntosValidos = k.puntos
      .map((p, i) => (p === null ? null : { x: xScale(i), y: yScale(p) }))
      .filter((p): p is { x: number; y: number } => p !== null);
    const pointsStr = puntosValidos.map((p) => `${p.x},${p.y}`).join(" ");
    return { color, pointsStr, puntosValidos, termino: k.termino };
  });

  return h(
    View,
    { style: { marginTop: 4 } },
    h(
      Svg,
      { width: ANCHO, height: ALTO, viewBox: `0 0 ${ANCHO} ${ALTO}` },
      ...lineasGrid.map((v, i) =>
        h(
          React.Fragment,
          { key: `g${i}` },
          h(Path, { d: `M${PAD.left},${yScale(v)} L${ANCHO - PAD.right},${yScale(v)}`, stroke: BORDE, strokeWidth: 0.75 }),
          h(Text, { x: 0, y: yScale(v) + 3, style: { fontSize: 7, fill: TEXTO_TERCIARIO } }, `#${v}`)
        )
      ),
      ...serie.fechas.map((f, i) =>
        h(Text, { key: `f${i}`, x: xScale(i) - 12, y: ALTO - 6, style: { fontSize: 7, fill: TEXTO_TERCIARIO } }, fmtF(f))
      ),
      ...lineas.map((l, idx) => [
        l.pointsStr ? h(Polyline, { key: `l${idx}`, points: l.pointsStr, fill: "none", stroke: l.color, strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" }) : null,
        ...l.puntosValidos.map((p, i) => h(Circle, { key: `c${idx}-${i}`, cx: p.x, cy: p.y, r: 2.25, fill: l.color })),
      ])
    ),
    h(
      View,
      { style: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, gap: 12 } },
      ...lineas.map((l, idx) =>
        h(
          View,
          { key: idx, style: { flexDirection: "row", alignItems: "center", gap: 4 } },
          h(View, { style: { width: 6, height: 6, borderRadius: 3, backgroundColor: l.color } }),
          h(Text, { style: { fontSize: 7.5, color: TEXTO_SEC } }, l.termino)
        )
      )
    )
  );
}

// =============================================================================
// PORTADA
// =============================================================================
function paginaPortada(datos: DatosInforme) {
  const dotGrid: any[] = [];
  for (let x = 0; x <= PAGINA.width; x += 16) {
    for (let y = 0; y <= 230; y += 16) {
      dotGrid.push(h(Circle, { key: `${x}-${y}`, cx: x, cy: y, r: 0.7, fill: AZUL_MARINO, fillOpacity: 0.07 }));
    }
  }

  // Motivo abstracto: barras ascendentes muy sutiles — evocan progreso /
  // ranking sin ser una gráfica literal de datos inventados.
  const barras = [34, 52, 44, 68, 58, 84, 96].map((alt, i) =>
    h(Rect, {
      key: i,
      x: i * 22,
      y: 96 - alt,
      width: 13,
      height: alt,
      rx: 2.5,
      fill: AZUL_AIBE,
      fillOpacity: 0.1 + i * 0.11,
    })
  );

  return h(
    Page,
    { size: "A4", style: [styles.page, { backgroundColor: BLANCO }], key: "portada" },
    h(Svg, { width: PAGINA.width, height: 230, style: { position: "absolute", top: 0, left: 0 } }, ...dotGrid),

    h(
      View,
      { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" } },
      LOGO_AIBE ? h(Image, { src: LOGO_AIBE, style: { height: 26, width: 26 * LOGO_RATIO, marginTop: 8 } }) : null,
      // Logo propio del cliente (subido desde /admin) — si todavía no tiene
      // uno, no se muestra nada aquí: nunca un placeholder feo.
      datos.cliente.logo_url
        ? h(Image, { src: { uri: datos.cliente.logo_url }, style: { maxHeight: 34, maxWidth: 130, objectFit: "contain" } })
        : null
    ),

    h(
      View,
      { style: { marginTop: 140 } },
      h(Text, { style: { fontSize: 9.5, color: AZUL_AIBE, fontWeight: PESO_SEMI as any, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 14 } }, "Informe mensual de posicionamiento"),
      h(Text, { style: { fontSize: 32, fontFamily: FF_BOLD, fontWeight: PESO_BOLD as any, color: AZUL_MARINO, maxWidth: 420, lineHeight: 1.12 } }, datos.cliente.nombre_negocio),
      h(
        View,
        { style: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 } },
        h(View, { style: { paddingVertical: 4, paddingHorizontal: 10, backgroundColor: AZUL_CLARO, borderRadius: 5 } }, h(Text, { style: { fontSize: 10.5, fontWeight: PESO_SEMI as any, color: AZUL_AIBE } }, capitalizar(datos.mesEtiqueta))),
        datos.sitio?.dominio ? h(Text, { style: { fontSize: 10.5, color: TEXTO_SEC } }, datos.sitio.dominio) : null
      )
    ),

    h(Svg, { width: 176, height: 96, style: { position: "absolute", right: 44, top: 400 } }, ...barras),

    h(
      View,
      { style: { position: "absolute", left: MARGEN.left, right: MARGEN.right, bottom: 64, borderTopWidth: 1, borderTopColor: BORDE, paddingTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" } },
      h(
        View,
        null,
        h(Text, { style: { fontSize: 7.5, color: TEXTO_TERCIARIO, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 } }, "Preparado por"),
        h(Text, { style: { fontSize: 11.5, fontWeight: PESO_SEMI as any, color: AZUL_MARINO } }, "Aibe Technologies")
      ),
      h(Text, { style: { fontSize: 8, color: TEXTO_TERCIARIO } }, new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }))
    )
  );
}

// =============================================================================
// PÁGINA — RESUMEN EJECUTIVO
// =============================================================================
function paginaResumen(datos: DatosInforme) {
  const { kpis, keywords } = datos;
  const conPosicion = keywords.filter((k) => k.posicionActual !== null).length;
  const conCambio = keywords.filter((k) => k.cambio !== null);
  const cambioMedio =
    conCambio.length > 0 ? Math.round((conCambio.reduce((s, k) => s + (k.cambio ?? 0), 0) / conCambio.length) * 10) / 10 : null;

  const insights = generarInsights(datos);

  const tiles = [
    KpiTile({ label: "Keywords monitorizadas", valor: String(kpis.totalKeywords), icono: "search" }),
    KpiTile({ label: "Con posición detectada", valor: String(conPosicion), icono: "target" }),
    KpiTile({ label: "Mejor posición", valor: kpis.mejorPosicion !== null ? `#${kpis.mejorPosicion}` : "—", icono: "award" }),
    KpiTile({ label: "Acciones en curso", valor: String(kpis.objetivosActivos), icono: "clipboardList" }),
  ];
  if (kpis.mejoran !== null) {
    tiles.push(KpiTile({ label: "Keywords que mejoran", valor: String(kpis.mejoran), icono: "trendingUp", colorValor: kpis.mejoran > 0 ? VERDE : AZUL_MARINO }));
  }
  if (cambioMedio !== null) {
    tiles.push(
      KpiTile({
        label: "Cambio medio",
        valor: `${cambioMedio > 0 ? "+" : ""}${cambioMedio}`,
        icono: "activity",
        colorValor: cambioMedio > 0 ? VERDE : cambioMedio < 0 ? ROJO : AZUL_MARINO,
      })
    );
  }

  return h(
    Page,
    { size: "A4", style: styles.page, key: "resumen" },
    CabeceraPagina(datos.cliente.nombre_negocio),
    SeccionTitulo("Resumen ejecutivo", "Resumen del mes", "Así está evolucionando tu visibilidad en Google."),

    h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginBottom: 22 } }, ...tiles),

    insights.length > 0
      ? h(
          View,
          { style: { backgroundColor: FONDO, borderRadius: 10, borderWidth: 1, borderColor: BORDE_SUAVE, padding: 16, marginBottom: 22 }, wrap: false },
          h(Text, { style: { fontSize: 10.5, fontWeight: PESO_SEMI as any, color: AZUL_MARINO, marginBottom: 10 } }, "Lo más importante del mes"),
          h(
            View,
            { style: { gap: 6.5 } },
            ...insights.map((texto, i) =>
              h(
                View,
                { key: i, style: { flexDirection: "row", gap: 7 } },
                h(View, { style: { width: 3.5, height: 3.5, borderRadius: 1.75, backgroundColor: AZUL_AIBE, marginTop: 4 } }),
                h(Text, { style: { fontSize: 9, color: TEXTO, lineHeight: 1.45, flex: 1 } }, texto)
              )
            )
          )
        )
      : null,

    datos.hayHistoricoSuficiente && datos.serieHistorica
      ? h(
          View,
          { wrap: false },
          h(Text, { style: { fontSize: 11, fontWeight: PESO_SEMI as any, color: AZUL_MARINO, marginBottom: 4 } }, "Evolución de posiciones"),
          h(Text, { style: { fontSize: 8, color: TEXTO_TERCIARIO, marginBottom: 6 } }, "Palabras clave prioritarias, últimas mediciones registradas."),
          GraficaEvolucion(datos.serieHistorica)
        )
      : null,

    PiePagina(datos.mesEtiqueta)
  );
}

// =============================================================================
// PÁGINA — POSICIONAMIENTO / KEYWORDS
// =============================================================================
function paginaKeywords(datos: DatosInforme) {
  const cols = { kw: 3.1, ant: 1, act: 1, cambio: 1.25, estado: 1.65 };

  return h(
    Page,
    { size: "A4", style: styles.page, key: "keywords" },
    CabeceraPagina(datos.cliente.nombre_negocio),
    SeccionTitulo("Posicionamiento", "Posicionamiento en Google", "Seguimiento de las búsquedas prioritarias para tu negocio."),

    datos.keywords.length === 0
      ? h(Text, { style: { fontSize: 9.5, color: TEXTO_TERCIARIO } }, "Todavía no hay palabras clave cargadas para este cliente.")
      : h(
          View,
          null,
          h(
            View,
            { style: { flexDirection: "row", borderBottomWidth: 1.25, borderBottomColor: AZUL_MARINO, paddingBottom: 7, marginBottom: 2 }, fixed: false },
            h(Text, { style: { flex: cols.kw, fontSize: 7.5, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, textTransform: "uppercase", letterSpacing: 0.5 } }, "Palabra clave"),
            h(Text, { style: { flex: cols.ant, fontSize: 7.5, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" } }, "Anterior"),
            h(Text, { style: { flex: cols.act, fontSize: 7.5, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" } }, "Actual"),
            h(Text, { style: { flex: cols.cambio, fontSize: 7.5, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" } }, "Cambio"),
            h(Text, { style: { flex: cols.estado, fontSize: 7.5, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" } }, "Estado")
          ),
          ...datos.keywords.map((k, i) =>
            h(
              View,
              { key: i, wrap: false, style: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.75, borderBottomColor: BORDE_SUAVE } },
              h(Text, { style: { flex: cols.kw, fontSize: 9, color: TEXTO, paddingRight: 6 } }, k.termino),
              h(Text, { style: { flex: cols.ant, fontSize: 9, color: TEXTO_SEC, textAlign: "center" } }, k.posicionAnterior !== null ? `#${k.posicionAnterior}` : "—"),
              h(Text, { style: { flex: cols.act, fontSize: 11, fontWeight: PESO_BOLD as any, fontFamily: FF_BOLD, color: AZUL_MARINO, textAlign: "center" } }, k.posicionActual !== null ? `#${k.posicionActual}` : "—"),
              h(View, { style: { flex: cols.cambio, alignItems: "center" } }, CambioIndicador(k.cambio)),
              h(View, { style: { flex: cols.estado, alignItems: "center" } }, EstadoBadge(k.posicionActual))
            )
          )
        ),
    PiePagina(datos.mesEtiqueta)
  );
}

// =============================================================================
// PÁGINA — COMPETENCIA (nivel 1: resumen; nivel 2: top 5 por keyword)
// =============================================================================
function paginaCompetencia(datos: DatosInforme) {
  const frecuentes = datos.competidoresFrecuentes;
  const maxApariciones = frecuentes.length > 0 ? Math.max(...frecuentes.map((c) => c.apariciones)) : 1;

  const bloqueResumen =
    frecuentes.length === 0
      ? h(Text, { style: { fontSize: 9.5, color: TEXTO_TERCIARIO, marginBottom: 20 } }, "Todavía no hay competidores registrados.")
      : h(
          View,
          { style: { marginBottom: 24 }, wrap: false },
          ...frecuentes.map((c, i) =>
            h(
              View,
              { key: i, style: { flexDirection: "row", alignItems: "center", marginBottom: 7, gap: 10 } },
              h(Text, { style: { width: 150, fontSize: 8.75, color: TEXTO, paddingRight: 4 } }, c.dominio),
              h(
                View,
                { style: { flex: 1, height: 7, backgroundColor: FONDO, borderRadius: 3.5, overflow: "hidden" } },
                h(View, { style: { width: `${Math.max(6, (c.apariciones / maxApariciones) * 100)}%`, height: 7, backgroundColor: AZUL_AIBE, borderRadius: 3.5 } })
              ),
              h(Text, { style: { width: 78, fontSize: 8, color: TEXTO_SEC, textAlign: "right" } }, `${c.apariciones} búsqueda${c.apariciones === 1 ? "" : "s"}`)
            )
          )
        );

  const grupos = datos.competidoresPorKeyword;

  return h(
    Page,
    { size: "A4", style: styles.page, key: "competencia" },
    CabeceraPagina(datos.cliente.nombre_negocio),
    SeccionTitulo("Competencia", "Competencia en Google", "Estos son los dominios que compiten con mayor frecuencia por las mismas búsquedas."),

    bloqueResumen,

    grupos.length > 0
      ? h(
          View,
          { wrap: false },
          h(Text, { style: { fontSize: 11, fontWeight: PESO_SEMI as any, color: AZUL_MARINO, marginBottom: 3 } }, "Top 5 por palabra clave"),
          h(Text, { style: { fontSize: 8, color: TEXTO_TERCIARIO, marginBottom: 4, maxWidth: 460 } }, "Quién ocupa actualmente las primeras posiciones para cada búsqueda monitorizada."),
          h(Text, { style: { fontSize: 7.5, color: TEXTO_TERCIARIO, marginBottom: 12, maxWidth: 460 } }, "El Top 5 muestra los dominios que actualmente ocupan las primeras posiciones de Google para cada búsqueda analizada.")
        )
      : null,

    h(
      View,
      { style: { flexDirection: "row", flexWrap: "wrap", gap: 12 } },
      ...grupos.map((g, i) => TarjetaCompetidorKeyword(g, i))
    ),

    PiePagina(datos.mesEtiqueta)
  );
}

function TarjetaCompetidorKeyword(grupo: DatosInforme["competidoresPorKeyword"][number], key: number) {
  const anchoCol = (CONTENT_W - 12) / 2;
  return h(
    View,
    {
      key,
      wrap: false,
      style: {
        width: anchoCol,
        backgroundColor: BLANCO,
        borderWidth: 1,
        borderColor: BORDE,
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
      },
    },
    h(Text, { style: { fontSize: 9.5, fontWeight: PESO_SEMI as any, color: AZUL_MARINO, marginBottom: 9 } }, grupo.keyword),
    h(
      View,
      { style: { gap: 6.5 } },
      ...grupo.top.slice(0, 5).map((c, i) =>
        h(
          View,
          { key: i, style: { flexDirection: "row", alignItems: "center", gap: 8 } },
          h(
            View,
            {
              style: {
                width: 15,
                height: 15,
                borderRadius: 7.5,
                backgroundColor: i === 0 ? AZUL_AIBE : GRIS_BADGE,
                alignItems: "center",
                justifyContent: "center",
              },
            },
            h(Text, { style: { fontSize: 7.5, fontWeight: PESO_BOLD as any, color: i === 0 ? BLANCO : TEXTO_SEC } }, String(c.posicion ?? i + 1))
          ),
          h(Text, { style: { fontSize: 8.25, color: TEXTO, flex: 1, lineHeight: 1.3 } }, c.dominio)
        )
      )
    )
  );
}

// =============================================================================
// PÁGINA — RENDIMIENTO TÉCNICO + TRÁFICO
// =============================================================================
function paginaTecnico(datos: DatosInforme) {
  const { pagespeed, yandex } = datos;

  const tarjetasTecnicas = pagespeed
    ? [
        pagespeed.puntuacionMovil !== null
          ? TarjetaTecnica({
              label: "Rendimiento móvil",
              valor: `${pagespeed.puntuacionMovil} / 100`,
              estado: estadoPuntuacion(pagespeed.puntuacionMovil),
              explicacion: "Puntuación general de velocidad y experiencia de carga en móvil.",
            })
          : null,
        pagespeed.lcp
          ? TarjetaTecnica({
              label: "Carga principal (LCP)",
              valor: pagespeed.lcp,
              estado: estadoLCP(parseFloat(pagespeed.lcp)),
              explicacion: "Tiempo que tarda en mostrarse el contenido principal de la página.",
            })
          : null,
        pagespeed.cls
          ? TarjetaTecnica({
              label: "Estabilidad visual (CLS)",
              valor: pagespeed.cls,
              estado: estadoCLS(parseFloat(pagespeed.cls)),
              explicacion: "Mide si los elementos de la página se mueven mientras carga.",
            })
          : null,
      ].filter(Boolean)
    : [];

  return h(
    Page,
    { size: "A4", style: styles.page, key: "tecnico" },
    CabeceraPagina(datos.cliente.nombre_negocio),
    SeccionTitulo("Rendimiento técnico", "Rendimiento de tu web", "Indicadores técnicos que pueden influir en la experiencia del usuario y el posicionamiento."),

    pagespeed && tarjetasTecnicas.length > 0
      ? h(View, { style: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 26 } }, ...tarjetasTecnicas)
      : h(
          View,
          { style: { backgroundColor: FONDO, borderRadius: 10, padding: 14, marginBottom: 26 } },
          h(Text, { style: { fontSize: 9, color: TEXTO_TERCIARIO } }, "Pendiente: falta configurar la conexión con Google PageSpeed Insights para incluir aquí el rendimiento técnico real.")
        ),

    h(Text, { style: { fontSize: 11, fontWeight: PESO_SEMI as any, color: AZUL_MARINO, marginBottom: 3 } }, "Actividad del sitio"),
    h(Text, { style: { fontSize: 8, color: TEXTO_TERCIARIO, marginBottom: 12 } }, "Visitas y comportamiento reales de tu web, medidos con analítica."),

    yandex
      ? h(
          View,
          null,
          h(
            View,
            { style: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 } },
            KpiTile({ label: "Visitas", valor: String(yandex.visitas), icono: "users" }),
            KpiTile({ label: "Páginas vistas", valor: String(yandex.paginasVistas), icono: "search" }),
            KpiTile({ label: "Tasa de rebote", valor: `${yandex.rebote}%`, icono: "activity" })
          ),
          h(
            Link,
            { src: yandex.urlPanel, style: { fontSize: 8.5, color: AZUL_AIBE, fontWeight: PESO_SEMI as any, textDecoration: "none" } },
            "Ver mapas de calor y sesiones →"
          )
        )
      : h(
          View,
          { style: { backgroundColor: FONDO, borderRadius: 10, padding: 14 } },
          h(Text, { style: { fontSize: 9, color: TEXTO_TERCIARIO } }, "Pendiente: falta conectar la analítica del sitio para traer aquí visitas, mapas de calor y sesiones automáticamente.")
        ),

    PiePagina(datos.mesEtiqueta)
  );
}

// =============================================================================
// PÁGINA — PLAN DE ACCIÓN + TRABAJO REALIZADO
// =============================================================================
const ORDEN_PILARES = ["contenido", "tecnico", "menciones"];

function paginaPlan(datos: DatosInforme) {
  const { objetivos, tareasCompletadasMes } = datos;

  const porPilar = new Map<string, typeof objetivos>();
  for (const o of objetivos) {
    const lista = porPilar.get(o.pilar) ?? [];
    lista.push(o);
    porPilar.set(o.pilar, lista);
  }
  const pilaresPresentes = [...porPilar.keys()].sort((a, b) => ORDEN_PILARES.indexOf(a) - ORDEN_PILARES.indexOf(b));

  return h(
    Page,
    { size: "A4", style: styles.page, key: "plan" },
    CabeceraPagina(datos.cliente.nombre_negocio),
    SeccionTitulo("Ejecución", "Plan de acción SEO", "Estas son las acciones que estamos trabajando para mejorar tu posicionamiento."),

    objetivos.length === 0
      ? h(Text, { style: { fontSize: 9.5, color: TEXTO_TERCIARIO, marginBottom: 22 } }, "Todavía no hay acciones planificadas para este cliente.")
      : h(
          View,
          { style: { marginBottom: 26 } },
          ...pilaresPresentes.map((pilar, gi) =>
            h(
              View,
              { key: gi, style: { marginBottom: 16 } },
              h(Text, { style: { fontSize: 9, fontWeight: PESO_SEMI as any, color: TEXTO_SEC, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 } }, labelPilar(pilar)),
              h(
                View,
                { style: { gap: 8 } },
                ...(porPilar.get(pilar) ?? []).map((o, i) =>
                  h(
                    View,
                    { key: i, wrap: false, style: { flexDirection: "row", gap: 10, backgroundColor: FONDO, borderRadius: 8, padding: 11 } },
                    h(View, { style: { paddingTop: 1 } }, EstadoObjetivoBadge(o.estado)),
                    h(
                      View,
                      { style: { flex: 1 } },
                      h(Text, { style: { fontSize: 9, color: TEXTO, lineHeight: 1.4 } }, o.descripcion),
                      o.plazo ? h(Text, { style: { fontSize: 7.5, color: TEXTO_TERCIARIO, marginTop: 3 } }, `Plazo: ${fmtFecha(o.plazo)}`) : null
                    )
                  )
                )
              )
            )
          )
        ),

    h(Text, { style: { fontSize: 11, fontWeight: PESO_SEMI as any, color: AZUL_MARINO, marginBottom: 3 } }, `Trabajo realizado en ${datos.mesEtiqueta}`),
    h(Text, { style: { fontSize: 8, color: TEXTO_TERCIARIO, marginBottom: 12 } }, "Acciones ya completadas este mes para tu negocio."),

    tareasCompletadasMes.length === 0
      ? h(
          View,
          { style: { backgroundColor: FONDO, borderRadius: 10, padding: 16, alignItems: "center" } },
          h(Text, { style: { fontSize: 9, color: TEXTO_TERCIARIO, textAlign: "center" } }, "Todavía no hay acciones registradas como completadas este mes.")
        )
      : h(
          View,
          { style: { gap: 8 } },
          ...tareasCompletadasMes.map((t, i) =>
            h(
              View,
              { key: i, wrap: false, style: { flexDirection: "row", gap: 9, alignItems: "flex-start" } },
              h(
                View,
                { style: { width: 16, height: 16, borderRadius: 8, backgroundColor: VERDE_CLARO, alignItems: "center", justifyContent: "center", marginTop: 1 } },
                Icono("checkCircle", { size: 10, color: VERDE, strokeWidth: 2.5 })
              ),
              h(
                View,
                { style: { flex: 1 } },
                h(Text, { style: { fontSize: 9, color: TEXTO, lineHeight: 1.4 } }, t.descripcion),
                h(
                  View,
                  { style: { flexDirection: "row", gap: 8, marginTop: 2 } },
                  h(Text, { style: { fontSize: 7.5, color: TEXTO_TERCIARIO } }, `${labelPilar(t.pilar)} · Completado · ${fmtFecha(t.creadoEn)}`),
                  t.evidenciaUrl
                    ? h(Link, { src: t.evidenciaUrl, style: { fontSize: 7.5, color: AZUL_AIBE, fontWeight: PESO_SEMI as any, textDecoration: "none" } }, "Ver evidencia →")
                    : null
                )
              )
            )
          )
        ),

    PiePagina(datos.mesEtiqueta)
  );
}

// =============================================================================
// Documento completo
// =============================================================================
export async function generarInformePDF(datos: DatosInforme): Promise<Buffer> {
  const documento = h(
    Document,
    { title: `Informe SEO — ${datos.cliente.nombre_negocio} — ${datos.mesEtiqueta}` },
    paginaPortada(datos),
    paginaResumen(datos),
    paginaKeywords(datos),
    paginaCompetencia(datos),
    paginaTecnico(datos),
    paginaPlan(datos)
  );
  return renderToBuffer(documento as any);
}
