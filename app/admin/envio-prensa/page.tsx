import { createServiceClient } from "@/lib/supabase/server";
import ToggleAutomatico from "@/components/ToggleAutomatico";
import EnviarBoton from "@/components/EnviarBoton";

// El contador de envíos de hoy y el estado del interruptor cambian en
// cualquier momento — igual que /admin, esta página no debe quedar
// congelada en una versión estática generada en el build.
export const dynamic = "force-dynamic";

// Datos de ejemplo — visibles solo hasta que .env.local tenga las claves
// de Supabase reales, para poder revisar el diseño de la página ya mismo.
const DEMO = {
  automatico: false,
  cuenta: { id: "demo-cuenta", email: "contenidos.locales10@gmail.com", limite_diario: 5 },
  enviadosHoy: 2,
  blogs: [
    {
      id: "demo-blog-1",
      titulo: "5 señales de que necesitas una revisión dental antes de fin de año",
      cliente: "Clínica Dalí Dent",
      archivo_url: "#",
      destinatarios: [
        { id: "d1", email: "redaccion@diariolocal.es", medio: "Diario Local", enviado: true },
        { id: "d2", email: "salud@revistaregional.es", medio: "Revista Regional", enviado: false },
      ],
    },
  ],
};

async function getDatos() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ...DEMO, demo: true };
  }

  const supabase = createServiceClient();

  const [{ data: config }, { data: cuenta }] = await Promise.all([
    supabase.from("configuracion").select("valor").eq("clave", "envio_automatico_prensa").single(),
    supabase.from("cuentas_remitente").select("*").eq("email", "contenidos.locales10@gmail.com").single(),
  ]);

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const { count: enviadosHoy } = await supabase
    .from("blog_envios")
    .select("id", { count: "exact", head: true })
    .eq("cuenta_remitente_id", cuenta?.id)
    .gte("enviado_en", inicioHoy.toISOString());

  const { data: blogsData } = await supabase
    .from("blogs")
    .select("id, titulo, archivo_url, clientes(nombre_negocio), blog_destinatarios(id, email, medio)")
    .order("creado_en", { ascending: false });

  const blogs = (blogsData ?? []).map((b: any) => ({
    id: b.id,
    titulo: b.titulo,
    cliente: b.clientes?.nombre_negocio ?? "—",
    archivo_url: b.archivo_url,
    destinatarios: b.blog_destinatarios ?? [],
  }));

  return {
    demo: false,
    automatico: Boolean(config?.valor),
    cuenta: cuenta ?? DEMO.cuenta,
    enviadosHoy: enviadosHoy ?? 0,
    blogs,
  };
}

export default async function EnvioPrensaPage() {
  const { demo, automatico, cuenta, enviadosHoy, blogs } = await getDatos();
  const cupoAgotado = enviadosHoy >= (cuenta?.limite_diario ?? 5);

  return (
    <div className="max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold text-ink">Envío de contenido a prensa</h1>
      <p className="mb-6 text-sm text-ink/60">
        Control interno de la vía 3 de menciones (prensa y medios locales) — nunca visible para el
        cliente.
      </p>

      {demo && (
        <div className="mb-6 rounded-md border border-warn/30 bg-warn/10 px-4 py-3 text-sm text-warn">
          Mostrando datos de ejemplo — conecta Supabase para ver los blogs y envíos reales.
        </div>
      )}

      <div className="mb-4">
        <ToggleAutomatico activo={automatico} />
      </div>

      <div className="mb-8 flex items-center justify-between rounded-lg border border-ink/10 bg-white px-5 py-4">
        <div>
          <p className="text-sm font-medium text-ink">{cuenta?.email}</p>
          <p className="text-xs text-ink/50">Cuenta remitente · se resetea a medianoche</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-semibold tabular-nums ${cupoAgotado ? "text-warn" : "text-ink"}`}>
            {enviadosHoy}/{cuenta?.limite_diario ?? 5}
          </p>
          <p className="text-xs text-ink/50">enviados hoy</p>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-ink/50">Blogs</h2>

      <div className="space-y-4">
        {blogs.length === 0 && (
          <p className="text-sm text-ink/50">
            Todavía no hay blogs redactados para prensa. El agente los añadirá aquí en su ciclo
            semanal (Paso 3, vía 3 de menciones).
          </p>
        )}

        {blogs.map((blog: any) => (
          <div key={blog.id} className="rounded-lg border border-ink/10 bg-white p-5">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink">{blog.titulo}</p>
                <p className="text-xs text-ink/50">{blog.cliente}</p>
              </div>
              <a
                href={blog.archivo_url ?? "#"}
                className="shrink-0 rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-accent hover:text-accent"
              >
                Descargar
              </a>
            </div>

            <ul className="divide-y divide-ink/10 border-t border-ink/10">
              {blog.destinatarios.map((d: any) => (
                <li key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-ink">{d.email}</p>
                    {d.medio && <p className="text-xs text-ink/50">{d.medio}</p>}
                  </div>
                  {automatico ? (
                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent">
                      Automático
                    </span>
                  ) : d.enviado ? (
                    <span className="text-xs text-ink/40">Ya enviado</span>
                  ) : (
                    <EnviarBoton
                      destinatarioId={d.id}
                      cuentaRemitenteId={cuenta?.id}
                      disabled={cupoAgotado}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-ink/40">
        ¿Necesitáis enviar más de {cuenta?.limite_diario ?? 5} correos al día? Podéis dar de alta
        otra cuenta Gmail remitente en Supabase (tabla <code>cuentas_remitente</code>) — cada una
        con su propio contador, tal y como describe la sección 09 del documento de estrategia.
      </p>
    </div>
  );
}
