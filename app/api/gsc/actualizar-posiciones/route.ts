import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { obtenerRendimientoBusqueda, normalizar } from "@/lib/google-search-console";

// Endpoint interno (sin interfaz) que refresca keywords.posicion_actual con
// datos reales de Search Console para todos los clientes con propiedad
// verificada. Pensado para dispararse manualmente ahora y, más adelante,
// desde una tarea programada semanal (Paso 3, sección 09 de la estrategia).
// Protegido con un secreto compartido para que no cualquiera pueda
// dispararlo sin más (no expone datos sensibles, pero evita ruido/abuso).
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.INTERNAL_CRON_SECRET || secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: sitios, error: errorSitios } = await supabase
    .from("sitios_web")
    .select("cliente_id, gsc_property, clientes(nombre_negocio, activo)")
    .not("gsc_property", "is", null);

  if (errorSitios) {
    return NextResponse.json({ error: errorSitios.message }, { status: 500 });
  }

  const resumen: any[] = [];

  for (const sitio of sitios ?? []) {
    const cliente = Array.isArray(sitio.clientes) ? sitio.clientes[0] : sitio.clientes;
    if (!cliente?.activo) continue;

    try {
      const filas = await obtenerRendimientoBusqueda(sitio.gsc_property as string, 28);
      const porQueryNormalizada = new Map(filas.map((f) => [normalizar(f.query), f]));

      const { data: keywords } = await supabase
        .from("keywords")
        .select("id, termino")
        .eq("cliente_id", sitio.cliente_id);

      let actualizadas = 0;
      const sinDatosTodavia: string[] = [];

      for (const kw of keywords ?? []) {
        const fila = porQueryNormalizada.get(normalizar(kw.termino));
        if (fila) {
          const posicionRedondeada = Math.round(fila.position);
          await supabase
            .from("keywords")
            .update({ posicion_actual: posicionRedondeada, actualizado_en: new Date().toISOString() })
            .eq("id", kw.id);
          // Guarda también un punto en el historial — es lo que permite
          // dibujar la evolución real en el informe mensual, en vez de solo
          // la última foto fija.
          await supabase.from("posiciones_historial").insert({
            cliente_id: sitio.cliente_id,
            keyword_id: kw.id,
            posicion: posicionRedondeada,
            clics: Math.round(fila.clicks ?? 0),
            impresiones: Math.round(fila.impressions ?? 0),
          });
          actualizadas++;
        } else {
          sinDatosTodavia.push(kw.termino);
        }
      }

      resumen.push({
        cliente: cliente.nombre_negocio,
        keywordsActualizadas: actualizadas,
        keywordsSinDatosTodavia: sinDatosTodavia,
        totalQueriesEncontradasEnGSC: filas.length,
      });
    } catch (err) {
      resumen.push({ cliente: cliente?.nombre_negocio, error: (err as Error).message });
    }
  }

  return NextResponse.json({ resumen });
}
