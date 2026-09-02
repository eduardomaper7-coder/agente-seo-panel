// Genera el PDF del informe mensual con @react-pdf/renderer (renderiza en
// Node, sin necesidad de un navegador headless — encaja bien en una función
// serverless de Vercel). Usa React.createElement en vez de JSX porque este
// archivo no es .tsx (los route handlers de Next viven en route.ts).
//
// La marca se dibuja en vectores (Svg/texto), no con los PNG de
// public/marca/ — así el PDF no depende de leer archivos binarios del
// sistema de ficheros en el runtime serverless, y el mismo informe sirve
// para cualquier cliente futuro sin tener que embeber su logo a mano.
import React from "react";
import { Document, Page, View, Text, Svg, Path, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { DatosInforme } from "@/lib/informes-datos";

const h = React.createElement;

const AZUL_AIBE = "#124FC4";
const AZUL_OSCURO = "#0B1B3A";
const GRIS = "#5B6472";
const GRIS_CLARO = "#EEF1F6";
const VERDE = "#1F9D63";
const ROJO = "#D2483B";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: AZUL_OSCURO },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  marca: { flexDirection: "row", alignItems: "center", gap: 8 },
  marcaTextos: { flexDirection: "column" },
  marcaNombre: { fontSize: 13, fontFamily: "Helvetica-Bold", color: AZUL_OSCURO },
  marcaSub: { fontSize: 7, color: GRIS, letterSpacing: 0.5, textTransform: "uppercase" },
  insignia: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  insigniaTexto: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#FFFFFF" },
  tituloPortada: { fontSize: 26, fontFamily: "Helvetica-Bold", marginTop: 140, textAlign: "center" },
  subtituloPortada: { fontSize: 13, color: GRIS, marginTop: 8, textAlign: "center" },
  mesPortada: {
    fontSize: 14,
    color: AZUL_AIBE,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    textAlign: "center",
    textTransform: "capitalize",
  },
  eyebrow: { fontSize: 9, color: GRIS, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  h2: { fontSize: 15, fontFamily: "Helvetica-Bold", color: AZUL_OSCURO, marginBottom: 10 },
  seccion: { marginBottom: 26 },
  tiles: { flexDirection: "row", gap: 10, marginBottom: 4 },
  tile: { flex: 1, backgroundColor: GRIS_CLARO, borderRadius: 6, padding: 12 },
  tileValor: { fontSize: 20, fontFamily: "Helvetica-Bold", color: AZUL_AIBE },
  tileLabel: { fontSize: 8, color: GRIS, marginTop: 2 },
  tablaHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: AZUL_OSCURO,
    paddingBottom: 5,
    marginBottom: 4,
  },
  tablaHeadTexto: { fontSize: 8, textTransform: "uppercase", color: GRIS, letterSpacing: 0.5 },
  fila: { flexDirection: "row", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: GRIS_CLARO },
  colKeyword: { flex: 3 },
  colNum: { flex: 1, textAlign: "center" },
  barraFondo: { flex: 2, height: 6, backgroundColor: GRIS_CLARO, borderRadius: 3, marginTop: 2 },
  tarjetaKw: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: GRIS_CLARO, borderRadius: 6, padding: 10, marginBottom: 8 },
  tarjetaKwTitulo: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  compFila: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  compPos: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: GRIS_CLARO,
    textAlign: "center",
    fontSize: 8,
    paddingTop: 3,
    marginRight: 6,
  },
  notaVacio: { fontSize: 9, color: GRIS, fontStyle: "italic" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    borderTopColor: GRIS_CLARO,
    paddingTop: 8,
  },
  footerTexto: { fontSize: 7.5, color: GRIS },
});

function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean);
  return (palabras[0]?.[0] ?? "").toUpperCase() + (palabras[1]?.[0] ?? "").toUpperCase();
}

// Marca de Aibe Technologies: un triángulo simple en el azul de marca junto
// al nombre en dos líneas — evoca el isotipo real sin necesitar el PNG.
function AibeMark() {
  return h(
    View,
    { style: styles.marca },
    h(
      Svg,
      { width: 22, height: 22, viewBox: "0 0 24 24" },
      h(Path, { d: "M12 2 L22 20 L16.5 20 L12 11.5 L7.5 20 L2 20 Z", fill: AZUL_AIBE })
    ),
    h(
      View,
      { style: styles.marcaTextos },
      h(Text, { style: styles.marcaNombre }, "Aibe"),
      h(Text, { style: styles.marcaSub }, "Technologies")
    )
  );
}

// Insignia genérica del cliente: iniciales sobre un círculo de color +
// nombre del negocio — funciona para cualquier cliente futuro, no solo
// Dalí Dent, sin depender de tener su logo en ningún sitio.
function ClienteMark(nombre: string) {
  return h(
    View,
    { style: styles.marca },
    h(
      View,
      { style: [styles.insignia, { backgroundColor: AZUL_OSCURO }] },
      h(Text, { style: styles.insigniaTexto }, iniciales(nombre))
    ),
    h(Text, { style: styles.marcaNombre }, nombre)
  );
}

function Footer(pagina: string) {
  return h(
    View,
    { style: styles.footer, fixed: true },
    h(Text, { style: styles.footerTexto }, "Aibe Technologies · aibetech.es · info@aibetech.es · 699 30 18 19"),
    h(Text, { style: styles.footerTexto }, pagina)
  );
}

function flechaColor(inicio: number | null, fin: number | null) {
  if (inicio === null || fin === null) return GRIS;
  if (fin < inicio) return VERDE;
  if (fin > inicio) return ROJO;
  return GRIS;
}

function flechaTexto(inicio: number | null, fin: number | null) {
  // Los fuentes base del PDF (Helvetica) no incluyen flechas Unicode, así
  // que el cambio se comunica solo con el signo + el color (verde = mejora).
  if (inicio === null || fin === null) return "—";
  if (fin < inicio) return `+${inicio - fin}`;
  if (fin > inicio) return `-${fin - inicio}`;
  return "sin cambio";
}

export async function generarInformePDF(datos: DatosInforme): Promise<Buffer> {
  const conPosicionFin = datos.keywords.filter((k) => k.posicionFin !== null);
  const posicionMedia =
    conPosicionFin.length > 0
      ? Math.round((conPosicionFin.reduce((s, k) => s + (k.posicionFin ?? 0), 0) / conPosicionFin.length) * 10) / 10
      : null;
  const mejoradas = datos.keywords.filter(
    (k) => k.posicionInicio !== null && k.posicionFin !== null && k.posicionFin < k.posicionInicio
  ).length;
  const objetivosCumplidos = datos.objetivos.filter((o) => o.estado === "cumplido").length;
  const objetivosActivos = datos.objetivos.filter((o) => o.estado === "activo").length;

  const paginas: any[] = [];

  // --- Portada ---
  paginas.push(
    h(
      Page,
      { size: "A4", style: styles.page, key: "portada" },
      h(View, { style: styles.headerRow }, AibeMark(), ClienteMark(datos.cliente.nombre_negocio)),
      h(Text, { style: styles.tituloPortada }, datos.cliente.nombre_negocio),
      h(Text, { style: styles.subtituloPortada }, "Informe SEO mensual"),
      h(Text, { style: styles.mesPortada }, datos.mesEtiqueta),
      datos.sitio?.dominio
        ? h(Text, { style: [styles.subtituloPortada, { marginTop: 20 }] }, datos.sitio.dominio)
        : null,
      Footer("1")
    )
  );

  // --- Resumen + evolución de posiciones ---
  paginas.push(
    h(
      Page,
      { size: "A4", style: styles.page, key: "evolucion" },
      h(Text, { style: styles.eyebrow }, "Resumen ejecutivo"),
      h(Text, { style: styles.h2 }, "Cómo va el posicionamiento"),
      h(
        View,
        { style: styles.tiles },
        h(
          View,
          { style: styles.tile },
          h(Text, { style: styles.tileValor }, String(datos.keywords.length)),
          h(Text, { style: styles.tileLabel }, "Keywords en seguimiento")
        ),
        h(
          View,
          { style: styles.tile },
          h(Text, { style: styles.tileValor }, posicionMedia !== null ? `#${posicionMedia}` : "—"),
          h(Text, { style: styles.tileLabel }, "Posición media actual")
        ),
        h(
          View,
          { style: styles.tile },
          h(Text, { style: styles.tileValor }, String(mejoradas)),
          h(Text, { style: styles.tileLabel }, "Keywords que han mejorado este mes")
        ),
        h(
          View,
          { style: styles.tile },
          h(Text, { style: styles.tileValor }, `${objetivosCumplidos}/${objetivosCumplidos + objetivosActivos}`),
          h(Text, { style: styles.tileLabel }, "Objetivos cumplidos")
        )
      ),
      h(View, { style: [styles.seccion, { marginTop: 20 }] },
        h(Text, { style: styles.h2 }, "Evolución de posiciones (Google Search Console)"),
        datos.keywords.length === 0
          ? h(Text, { style: styles.notaVacio }, "Todavía no hay keywords cargadas para este cliente.")
          : h(
              View,
              null,
              h(
                View,
                { style: styles.tablaHead },
                h(Text, { style: [styles.tablaHeadTexto, styles.colKeyword] }, "Keyword"),
                h(Text, { style: [styles.tablaHeadTexto, styles.colNum] }, "Inicio mes"),
                h(Text, { style: [styles.tablaHeadTexto, styles.colNum] }, "Actual"),
                h(Text, { style: [styles.tablaHeadTexto, styles.colNum] }, "Cambio")
              ),
              ...datos.keywords.map((k, i) =>
                h(
                  View,
                  { style: styles.fila, key: i },
                  h(Text, { style: styles.colKeyword }, k.termino),
                  h(Text, { style: styles.colNum }, k.posicionInicio !== null ? `#${k.posicionInicio}` : "—"),
                  h(Text, { style: styles.colNum }, k.posicionFin !== null ? `#${k.posicionFin}` : "—"),
                  h(
                    Text,
                    { style: [styles.colNum, { color: flechaColor(k.posicionInicio, k.posicionFin) }] },
                    flechaTexto(k.posicionInicio, k.posicionFin)
                  )
                )
              )
            )
      ),
      Footer("2")
    )
  );

  // --- Competidores ---
  paginas.push(
    h(
      Page,
      { size: "A4", style: styles.page, key: "competidores" },
      h(Text, { style: styles.eyebrow }, "Vigilancia competitiva"),
      h(Text, { style: styles.h2 }, "Quién ocupa hoy el top 5 por keyword"),
      datos.competidoresPorKeyword.length === 0
        ? h(Text, { style: styles.notaVacio }, "Todavía no hay ranking de competidores cargado.")
        : datos.competidoresPorKeyword.map((grupo, i) =>
            h(
              View,
              { style: styles.tarjetaKw, key: i },
              h(Text, { style: styles.tarjetaKwTitulo }, grupo.keyword),
              ...grupo.top.map((c, j) =>
                h(
                  View,
                  { style: styles.compFila, key: j },
                  h(Text, { style: styles.compPos }, String(c.posicion ?? "—")),
                  h(Text, null, c.dominio)
                )
              )
            )
          ),
      Footer("3")
    )
  );

  // --- Rendimiento técnico + tráfico real ---
  paginas.push(
    h(
      Page,
      { size: "A4", style: styles.page, key: "tecnico" },
      h(Text, { style: styles.eyebrow }, "Herramientas SEO profesionales"),
      h(Text, { style: styles.h2 }, "Rendimiento técnico (Google PageSpeed Insights)"),
      datos.pagespeed
        ? h(
            View,
            { style: styles.tiles },
            h(
              View,
              { style: styles.tile },
              h(Text, { style: styles.tileValor }, datos.pagespeed.puntuacionMovil !== null ? `${datos.pagespeed.puntuacionMovil}/100` : "—"),
              h(Text, { style: styles.tileLabel }, "Puntuación móvil")
            ),
            h(
              View,
              { style: styles.tile },
              h(Text, { style: styles.tileValor }, datos.pagespeed.lcp ?? "—"),
              h(Text, { style: styles.tileLabel }, "LCP (carga del contenido principal)")
            ),
            h(
              View,
              { style: styles.tile },
              h(Text, { style: styles.tileValor }, datos.pagespeed.cls ?? "—"),
              h(Text, { style: styles.tileLabel }, "CLS (estabilidad visual)")
            )
          )
        : h(
            Text,
            { style: styles.notaVacio },
            "Pendiente: falta configurar GOOGLE_PAGESPEED_API_KEY para incluir aquí Core Web Vitals reales."
          ),
      h(
        View,
        { style: [styles.seccion, { marginTop: 24 }] },
        h(Text, { style: styles.h2 }, "Tráfico real y mapas de calor (Yandex Metrika)"),
        datos.yandex
          ? h(
              View,
              null,
              h(
                View,
                { style: styles.tiles },
                h(
                  View,
                  { style: styles.tile },
                  h(Text, { style: styles.tileValor }, String(datos.yandex.visitas)),
                  h(Text, { style: styles.tileLabel }, "Visitas")
                ),
                h(
                  View,
                  { style: styles.tile },
                  h(Text, { style: styles.tileValor }, String(datos.yandex.paginasVistas)),
                  h(Text, { style: styles.tileLabel }, "Páginas vistas")
                ),
                h(
                  View,
                  { style: styles.tile },
                  h(Text, { style: styles.tileValor }, `${datos.yandex.rebote}%`),
                  h(Text, { style: styles.tileLabel }, "Tasa de rebote")
                )
              ),
              h(Text, { style: [styles.notaVacio, { marginTop: 8 }] }, `Mapas de calor y sesiones grabadas: ${datos.yandex.urlPanel}`)
            )
          : h(
              Text,
              { style: styles.notaVacio },
              "Pendiente: falta conectar el token de Yandex Metrika para traer aquí visitas, mapas de calor y sesiones automáticamente."
            )
      ),
      Footer("4")
    )
  );

  // --- Objetivos y trabajo realizado ---
  paginas.push(
    h(
      Page,
      { size: "A4", style: styles.page, key: "trabajo" },
      h(Text, { style: styles.eyebrow }, "Ejecución" ),
      h(Text, { style: styles.h2 }, "Objetivos"),
      datos.objetivos.length === 0
        ? h(Text, { style: styles.notaVacio }, "Todavía no hay objetivos cargados.")
        : datos.objetivos.map((o, i) =>
            h(
              View,
              { style: styles.fila, key: i },
              h(Text, { style: { flex: 3 } }, o.descripcion),
              h(Text, { style: { flex: 1, textAlign: "right", color: o.estado === "cumplido" ? VERDE : GRIS } }, o.estado)
            )
          ),
      h(
        View,
        { style: [styles.seccion, { marginTop: 24 }] },
        h(Text, { style: styles.h2 }, `Trabajo realizado en ${datos.mesEtiqueta}`),
        datos.tareasCompletadas.length === 0
          ? h(
              Text,
              { style: styles.notaVacio },
              "Sin tareas completadas registradas este mes todavía en el panel."
            )
          : datos.tareasCompletadas.map((t, i) =>
              h(
                View,
                { style: styles.fila, key: i },
                h(Text, { style: { flex: 3 } }, t.descripcion),
                h(Text, { style: { flex: 1, textAlign: "right" } }, t.pilar)
              )
            )
      ),
      Footer("5")
    )
  );

  const documento = h(Document, { title: `Informe SEO — ${datos.cliente.nombre_negocio} — ${datos.mesEtiqueta}` }, ...paginas);
  return renderToBuffer(documento as any);
}
