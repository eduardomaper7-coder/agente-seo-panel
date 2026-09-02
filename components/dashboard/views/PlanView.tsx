import { CheckCircle2, ClipboardList, Target } from "lucide-react";
import { DashboardData, labelPilar } from "@/lib/dashboard-datos";
import type { BadgeTone } from "@/components/ui/Badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

const ESTADO_LABEL: Record<string, string> = {
  activo: "En curso",
  cumplido: "Completado",
  completado: "Completado",
  pendiente: "Pendiente",
};

const ESTADO_TONE: Record<string, BadgeTone> = {
  activo: "info",
  cumplido: "success-soft",
  completado: "success-soft",
  pendiente: "neutral",
};

function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function PlanView({ datos }: { datos: DashboardData }) {
  const { objetivos, tareasCompletadas } = datos;

  const enCurso = objetivos.filter((o) => o.estado === "activo").length;
  const completadas = objetivos.filter((o) => o.estado === "cumplido" || o.estado === "completado").length;

  // Categorías reales presentes en los datos del cliente — no se asume un
  // conjunto fijo de pilares, se cuenta lo que exista de verdad.
  const porPilar = new Map<string, number>();
  for (const o of objetivos) porPilar.set(o.pilar, (porPilar.get(o.pilar) ?? 0) + 1);

  const ordenObjetivos = [...objetivos].sort((a, b) => {
    if (a.estado === b.estado) return 0;
    if (a.estado === "activo") return -1;
    if (b.estado === "activo") return 1;
    return 0;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan SEO"
        subtitle="Estas son las acciones que estamos trabajando para mejorar tu posicionamiento."
      />

      {objetivos.length === 0 && tareasCompletadas.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Target}
              title="Todavía no hay un plan de acción activo"
              description="En cuanto se definan las primeras acciones para tu negocio, aparecerán aquí."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          {objetivos.length > 0 && (
            <div className="flex flex-wrap gap-3">
              <StatCard label="En curso" value={enCurso} icon={ClipboardList} />
              <StatCard label="Completadas" value={completadas} icon={CheckCircle2} />
              {[...porPilar.entries()].map(([pilar, n]) => (
                <StatCard key={pilar} label={labelPilar(pilar)} value={n} />
              ))}
            </div>
          )}

          {objetivos.length > 0 && (
            <Card>
              <CardBody>
                <h2 className="mb-4 text-sm font-semibold text-ink">Acciones del plan</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {ordenObjetivos.map((o) => (
                    <div key={o.id} className="rounded-lg border border-ink/[0.08] p-3.5">
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Badge tone="neutral">{labelPilar(o.pilar)}</Badge>
                        <Badge tone={ESTADO_TONE[o.estado] ?? "neutral"}>
                          {ESTADO_LABEL[o.estado] ?? o.estado}
                        </Badge>
                      </div>
                      <p className="text-sm text-ink/80">{o.descripcion}</p>
                      {o.plazo && <p className="mt-1.5 text-xs text-ink/40">Plazo: {fmtFecha(o.plazo)}</p>}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardBody>
              <h2 className="mb-1 text-sm font-semibold text-ink">Trabajo realizado</h2>
              <p className="mb-4 text-xs text-ink/40">Acciones ya completadas para tu negocio.</p>
              {tareasCompletadas.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="Todavía no hay acciones completadas" />
              ) : (
                <ul className="space-y-2.5">
                  {tareasCompletadas.map((t) => (
                    <li key={t.id} className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" strokeWidth={2.25} />
                      <div className="min-w-0">
                        <p className="text-sm text-ink/80">
                          {t.descripcion}
                          <span className="text-ink/40"> — Completado · {fmtFecha(t.creadoEn)}</span>
                        </p>
                        {t.evidenciaUrl && (
                          <a href={t.evidenciaUrl} className="text-xs font-medium text-accent hover:underline">
                            Ver evidencia
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
