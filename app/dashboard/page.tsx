import Link from "next/link";
import { ArrowRight, Award, FileText, Search, Target, TrendingDown, TrendingUp } from "lucide-react";
import { getDashboardData, labelPilar } from "@/lib/dashboard-datos";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { KeywordPositionBadge } from "@/components/ui/KeywordPositionBadge";
import { TrendIndicator } from "@/components/ui/TrendIndicator";
import { EmptyState } from "@/components/ui/EmptyState";
import { EvolutionChart } from "@/components/dashboard/EvolutionChart";
import { CurrentStateVisual } from "@/components/dashboard/CurrentStateVisual";

function fmtFecha(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ResumenPage() {
  const datos = await getDashboardData();
  const {
    cliente,
    keywords,
    kpis,
    ultimaActualizacion,
    periodoAnalizado,
    hayHistoricoSuficiente,
    serieHistorica,
    objetivos,
    informes,
  } = datos;

  const topKeywords = [...keywords].sort((a, b) => (b.prioridad ?? 0) - (a.prioridad ?? 0)).slice(0, 5);
  const objetivosActivos = objetivos.filter((o) => o.estado === "activo").slice(0, 3);
  const ultimoInforme = informes[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${cliente.nombreNegocio}`}
        subtitle="Así está evolucionando tu visibilidad en Google."
        right={
          <div className="text-right">
            <p>{periodoAnalizado}</p>
            {ultimaActualizacion && <p className="text-ink/35">Actualizado el {fmtFecha(ultimaActualizacion)}</p>}
          </div>
        }
      />

      {/* Nivel 1 — resultados */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Keywords monitorizadas"
          value={kpis.totalKeywords}
          icon={Search}
          tooltip="El número total de búsquedas de Google que estamos siguiendo para tu negocio."
        />
        <StatCard
          label="En Top 10"
          value={kpis.enTop10}
          icon={Award}
          tooltip="Palabras clave para las que apareces entre los primeros 10 resultados de Google — la primera página."
        />
        <StatCard
          label="Mejor posición"
          value={kpis.mejorPosicion !== null ? `#${kpis.mejorPosicion}` : "—"}
          icon={TrendingUp}
          tooltip="La posición más alta que alcanzas hoy en Google, de entre todas tus palabras clave."
        />
        <StatCard
          label="Objetivos activos"
          value={kpis.objetivosActivos}
          icon={Target}
          tooltip="Acciones SEO que el equipo (o el agente autónomo) está trabajando ahora mismo para tu negocio."
        />
        {kpis.mejoran !== null && (
          <StatCard
            label="Mejoran"
            value={
              <span className="inline-flex items-center gap-1 text-success">
                <TrendingUp size={18} strokeWidth={2.5} /> {kpis.mejoran}
              </span>
            }
            tooltip="Palabras clave que han subido puestos desde la última medición."
          />
        )}
        {kpis.bajan !== null && kpis.bajan > 0 && (
          <StatCard
            label="Bajan"
            value={
              <span className="inline-flex items-center gap-1 text-danger">
                <TrendingDown size={18} strokeWidth={2.5} /> {kpis.bajan}
              </span>
            }
            tooltip="Palabras clave que han bajado puestos desde la última medición."
          />
        )}
      </div>

      {/* Nivel 2 — evolución */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              {hayHistoricoSuficiente ? "Evolución del posicionamiento" : "Estado actual del posicionamiento"}
            </h2>
            {!hayHistoricoSuficiente && (
              <span className="text-xs text-ink/40">La gráfica de evolución aparecerá en cuanto haya histórico suficiente</span>
            )}
          </div>
          {keywords.length === 0 ? (
            <EmptyState icon={Search} title="Todavía no hay palabras clave cargadas" description="En cuanto se den de alta, aparecerán aquí." />
          ) : hayHistoricoSuficiente && serieHistorica ? (
            <EvolutionChart serie={serieHistorica} />
          ) : (
            <CurrentStateVisual keywords={keywords} />
          )}
        </CardBody>
      </Card>

      {/* Resumen de palabras clave */}
      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Palabras clave prioritarias</h2>
            <Link href="/dashboard/palabras-clave" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              Ver todas las palabras clave <ArrowRight size={13} />
            </Link>
          </div>
          {topKeywords.length === 0 ? (
            <EmptyState icon={Search} title="Todavía no hay palabras clave cargadas" />
          ) : (
            <div className="divide-y divide-ink/[0.06]">
              {topKeywords.map((k) => (
                <div key={k.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="truncate text-sm text-ink">{k.termino}</span>
                  <div className="flex shrink-0 items-center gap-3">
                    <KeywordPositionBadge posicion={k.posicionActual} />
                    <span className="w-20 text-right">
                      <TrendIndicator delta={k.cambio} compact />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Nivel 3 — trabajo en curso, e informes, a un vistazo */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Qué estamos haciendo por ti</h2>
              <Link href="/dashboard/plan" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                Ver plan completo <ArrowRight size={13} />
              </Link>
            </div>
            {objetivosActivos.length === 0 ? (
              <EmptyState icon={Target} title="No hay acciones activas ahora mismo" />
            ) : (
              <ul className="space-y-2.5">
                {objetivosActivos.map((o) => (
                  <li key={o.id} className="flex items-start gap-2.5">
                    <Badge tone="info">{labelPilar(o.pilar)}</Badge>
                    <span className="text-sm text-ink/75">{o.descripcion}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="mb-4 text-sm font-semibold text-ink">Tu último informe</h2>
            {ultimoInforme ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <FileText size={18} />
                  </span>
                  <div>
                    <p className="text-sm font-medium capitalize text-ink">
                      {new Date(ultimoInforme.mes).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                    </p>
                    <p className="text-xs text-ink/45">Resumen mensual de posicionamiento</p>
                  </div>
                </div>
                {ultimoInforme.pdfUrl && (
                  <a
                    href={ultimoInforme.pdfUrl}
                    className="rounded-md border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/70 hover:border-accent hover:text-accent"
                  >
                    Descargar
                  </a>
                )}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No hay informes disponibles todavía" description="Aquí aparecerá tu informe mensual en cuanto se genere." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
