import { ChevronDown, Users } from "lucide-react";
import { DashboardData } from "@/lib/dashboard-datos";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export function CompetidoresView({ datos }: { datos: DashboardData }) {
  const { competidoresPorKeyword, competidoresFrecuentes } = datos;
  const totalBusquedas = competidoresPorKeyword.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competidores"
        subtitle="Descubre qué negocios aparecen en Google para las mismas búsquedas que tú."
      />

      {competidoresPorKeyword.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Users}
              title="Todavía no hay datos de competidores"
              description="En cuanto analicemos los resultados de Google para tus palabras clave, aparecerán aquí."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {competidoresFrecuentes.length > 0 && (
            <Card>
              <CardBody>
                <h2 className="mb-4 text-sm font-semibold text-ink">Competidores más frecuentes</h2>
                <div className="space-y-2.5">
                  {competidoresFrecuentes.map((c) => {
                    const pct = totalBusquedas > 0 ? Math.round((c.apariciones / totalBusquedas) * 100) : 0;
                    return (
                      <div key={c.dominio} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm text-ink/80 sm:w-56">{c.dominio}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.06]">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(pct, 4)}%` }} />
                        </div>
                        <span className="w-36 shrink-0 text-right text-xs text-ink/45">
                          Aparece en {c.apariciones} de {totalBusquedas} búsquedas
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <h2 className="mb-1 text-sm font-semibold text-ink">Competidores por palabra clave</h2>
              <p className="mb-4 text-xs text-ink/40">Top 5 · revisado periódicamente</p>
              <div className="divide-y divide-ink/[0.06]">
                {competidoresPorKeyword.map((grupo) => (
                  <details key={grupo.keywordId} className="group py-1.5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-md px-1.5 py-2 hover:bg-ink/[0.03]">
                      <span className="text-sm font-medium text-ink">{grupo.keyword}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge tone="neutral">{grupo.top.length} competidores</Badge>
                        <ChevronDown size={15} className="text-ink/35 transition-transform group-open:rotate-180" />
                      </span>
                    </summary>
                    <div className="px-1.5 pb-3 pt-1">
                      <ol className="space-y-1.5">
                        {grupo.top.slice(0, 5).map((c, i) => (
                          <li key={`${c.dominio}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                            <span className="flex items-center gap-2 text-ink/75">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-[11px] font-medium text-ink/50">
                                {i + 1}
                              </span>
                              {c.dominio}
                            </span>
                            <span className="text-xs text-ink/40">{c.posicion !== null ? `#${c.posicion}` : "—"}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </details>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
