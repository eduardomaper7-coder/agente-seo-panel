import { Download, FileText } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";

// Los informes ya no se muestran en el panel de ningún cliente — solo aquí,
// para que Eduardo los revise y los envíe él mismo por WhatsApp. Se saltan
// RLS a propósito (clave de servicio) porque esta ruta ya está protegida
// por requireAdmin() en app/admin/layout.tsx.
export const dynamic = "force-dynamic";

function fmtMes(iso: string) {
  const texto = new Date(iso).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

async function getInformes() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("informes")
    .select("id, mes, pdf_url, clientes(nombre_negocio, contacto_email)")
    .order("mes", { ascending: false });
  return data ?? [];
}

export default async function AdminInformesPage() {
  const informes = await getInformes();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-ink">Informes</h1>
        <p className="text-sm text-ink/60">
          Los ve solo el equipo de Aibe Technologies — envíaselos a cada cliente a mano, por ejemplo por WhatsApp.
        </p>
      </div>

      {informes.length === 0 ? (
        <div className="rounded-lg border border-ink/10 bg-white p-8">
          <EmptyState
            icon={FileText}
            title="Todavía no hay informes generados"
            description="En cuanto se genere el primer informe mensual de un cliente, aparecerá aquí."
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/[0.03] text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Mes</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {informes.map((inf: any) => {
                const cliente = Array.isArray(inf.clientes) ? inf.clientes[0] : inf.clientes;
                return (
                  <tr key={inf.id} className="border-t border-ink/10">
                    <td className="px-4 py-3 font-medium text-ink">{cliente?.nombre_negocio ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-ink/70">{fmtMes(inf.mes)}</td>
                    <td className="px-4 py-3 text-ink/50">{cliente?.contacto_email ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {inf.pdf_url ? (
                        <a
                          href={inf.pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          <Download size={13} /> Abrir PDF
                        </a>
                      ) : (
                        <span className="text-xs text-ink/30">En preparación</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
