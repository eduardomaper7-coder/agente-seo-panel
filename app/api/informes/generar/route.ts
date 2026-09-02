import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { reunirDatosInforme } from "@/lib/informes-datos";
import { generarInformePDF } from "@/lib/informes-pdf";

// Endpoint interno (sin interfaz) que genera el informe mensual en PDF para
// uno o todos los clientes activos: reúne datos reales (Search Console,
// competidores, objetivos, tareas, PageSpeed, Yandex Metrika), genera un PDF
// con marca de Aibe Technologies, lo sube al bucket "informes" de Supabase
// Storage y guarda la fila en la tabla `informes` (con upsert, así se puede
// regenerar el mismo mes sin duplicar). Pensado para dispararse a mano ahora
// y desde una Routine mensual más adelante (Paso 4).
//
// Parámetros opcionales:
//   ?mes=2026-08        (por defecto: el mes en curso)
//   ?clienteId=<uuid>   (por defecto: todos los clientes activos)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.INTERNAL_CRON_SECRET || secret !== process.env.INTERNAL_CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const supabase = createServiceClient();

  const mesParam = req.nextUrl.searchParams.get("mes");
  const mes = mesParam ?? new Date().toISOString().slice(0, 7); // YYYY-MM

  const clienteIdParam = req.nextUrl.searchParams.get("clienteId");
  let clienteIds: string[] = [];

  if (clienteIdParam) {
    clienteIds = [clienteIdParam];
  } else {
    const { data: clientes, error } = await supabase.from("clientes").select("id").eq("activo", true);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clienteIds = (clientes ?? []).map((c: any) => c.id);
  }

  const resumen: any[] = [];

  for (const clienteId of clienteIds) {
    try {
      const datos = await reunirDatosInforme(clienteId, mes);
      if (!datos) {
        resumen.push({ clienteId, error: "Cliente no encontrado." });
        continue;
      }

      const pdfBuffer = await generarInformePDF(datos);
      const rutaArchivo = `${clienteId}/${mes}.pdf`;

      const { error: errorSubida } = await supabase.storage
        .from("informes")
        .upload(rutaArchivo, pdfBuffer, { contentType: "application/pdf", upsert: true });

      if (errorSubida) {
        resumen.push({ clienteId, error: `Error al subir el PDF: ${errorSubida.message}` });
        continue;
      }

      const { data: publicUrlData } = supabase.storage.from("informes").getPublicUrl(rutaArchivo);

      const { error: errorGuardado } = await supabase.from("informes").upsert(
        {
          cliente_id: clienteId,
          mes: `${mes}-01`,
          pdf_url: publicUrlData.publicUrl,
          resumen_metricas: {
            keywords_en_seguimiento: datos.kpis.totalKeywords,
            keywords_mejoradas: datos.kpis.mejoran ?? 0,
            trafico: datos.yandex,
            pagespeed: datos.pagespeed,
          },
          resumen_trabajo: {
            objetivos_cumplidos: datos.objetivos.filter((o) => o.estado === "cumplido").length,
            objetivos_activos: datos.kpis.objetivosActivos,
            tareas_completadas: datos.tareasCompletadasMes.length,
          },
        },
        { onConflict: "cliente_id,mes" }
      );

      if (errorGuardado) {
        resumen.push({ clienteId, error: `Error al guardar en la tabla informes: ${errorGuardado.message}` });
        continue;
      }

      resumen.push({
        clienteId,
        cliente: datos.cliente.nombre_negocio,
        mes,
        pdf_url: publicUrlData.publicUrl,
      });
    } catch (err) {
      resumen.push({ clienteId, error: (err as Error).message });
    }
  }

  return NextResponse.json({ resumen });
}
