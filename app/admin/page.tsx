import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";

// Esta página consulta Supabase en cada visita — nunca debe quedar
// "congelada" en una versión estática generada en el momento del build,
// o mostraría siempre los mismos clientes aunque la base de datos cambie.
export const dynamic = "force-dynamic";

// Datos de ejemplo que se muestran solo si aún no hay conexión a Supabase
// configurada (.env.local vacío) — así el panel se puede revisar visualmente
// antes de tener el proyecto de base de datos creado.
const CLIENTES_DEMO = [
  {
    id: "demo-1",
    nombre_negocio: "Clínica Dalí Dent",
    sector: "Clínica dental",
    ubicacion: "España",
    activo: true,
  },
];

async function getClientes() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { clientes: CLIENTES_DEMO, demo: true };
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("clientes")
    .select("id, nombre_negocio, sector, ubicacion, activo")
    .order("creado_en", { ascending: false });
  return { clientes: data ?? [], demo: false };
}

export default async function AdminClientesPage() {
  const { clientes, demo } = await getClientes();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Cartera de clientes</h1>
          <p className="text-sm text-ink/60">
            {clientes.length} cliente{clientes.length === 1 ? "" : "s"} en el sistema
          </p>
        </div>
        <Link
          href="/admin/clientes/nuevo"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          + Alta de cliente
        </Link>
      </div>

      {demo && (
        <div className="mb-6 rounded-md border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          Mostrando datos de ejemplo — conecta las variables de Supabase en <code>.env.local</code>{" "}
          para ver los clientes reales.
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink/[0.03] text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Negocio</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c: any) => (
              <tr key={c.id} className="border-t border-ink/10">
                <td className="px-4 py-3 font-medium text-ink">{c.nombre_negocio}</td>
                <td className="px-4 py-3 text-ink/70">{c.sector ?? "—"}</td>
                <td className="px-4 py-3 text-ink/70">{c.ubicacion ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.activo ? "bg-accent/10 text-accent" : "bg-ink/10 text-ink/50"
                    }`}
                  >
                    {c.activo ? "Activo" : "Pausado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
