import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { subirLogoCliente } from "./actions";

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
    .select("id, nombre_negocio, sector, ubicacion, activo, auth_user_id, logo_url")
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
              <th className="px-4 py-3">Logo del informe</th>
              <th className="px-4 py-3" />
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
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {c.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logo_url}
                        alt={`Logo de ${c.nombre_negocio}`}
                        className="h-7 w-7 shrink-0 rounded border border-ink/10 object-contain bg-white"
                      />
                    ) : (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-dashed border-ink/15 text-[9px] text-ink/25">
                        —
                      </span>
                    )}
                    <form action={subirLogoCliente} className="flex items-center gap-1.5">
                      <input type="hidden" name="clienteId" value={c.id} />
                      <input
                        type="file"
                        name="logo"
                        accept="image/png,image/jpeg,image/webp"
                        required
                        className="w-32 text-[11px] text-ink/50 file:mr-1.5 file:rounded file:border-0 file:bg-ink/[0.06] file:px-1.5 file:py-1 file:text-[10px] file:text-ink/60"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-md border border-ink/15 px-2 py-1 text-[11px] font-medium text-ink/70 hover:bg-ink/[0.03]"
                      >
                        {c.logo_url ? "Cambiar" : "Subir"}
                      </button>
                    </form>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  {c.auth_user_id ? (
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Ver panel →
                    </Link>
                  ) : (
                    <span className="text-xs text-ink/30">Sin acceso creado</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
