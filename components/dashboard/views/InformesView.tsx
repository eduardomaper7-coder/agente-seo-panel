import { Download, FileText } from "lucide-react";
import { DashboardData } from "@/lib/dashboard-datos";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

function fmtMes(iso: string) {
  const texto = new Date(iso).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function InformesView({ datos }: { datos: DashboardData }) {
  const { informes } = datos;
  const [ultimo, ...anteriores] = informes;

  return (
    <div className="space-y-6">
      <PageHeader title="Informes" subtitle="Consulta y descarga los informes de evolución de tu posicionamiento." />

      {!ultimo ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={FileText}
              title="No hay informes disponibles todavía"
              description="Aquí aparecerá tu informe mensual en cuanto se genere."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardBody>
              <Badge tone="brand">Informe más reciente</Badge>
              <div className="mt-3 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <FileText size={20} />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-ink">{fmtMes(ultimo.mes)}</p>
                    <p className="text-sm text-ink/50">Resumen mensual de posicionamiento</p>
                  </div>
                </div>
                {ultimo.pdfUrl ? (
                  <a
                    href={ultimo.pdfUrl}
                    className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-aibe hover:bg-accent/90"
                  >
                    <Download size={15} /> Descargar PDF
                  </a>
                ) : (
                  <span className="text-xs text-ink/40">Informe en preparación</span>
                )}
              </div>
            </CardBody>
          </Card>

          {anteriores.length > 0 && (
            <Card>
              <CardBody>
                <h2 className="mb-3 text-sm font-semibold text-ink">Informes anteriores</h2>
                <div className="divide-y divide-ink/[0.06]">
                  {anteriores.map((inf) => (
                    <div key={inf.mes} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <FileText size={15} className="text-ink/35" />
                        <span className="text-sm text-ink/75">{fmtMes(inf.mes)}</span>
                      </div>
                      {inf.pdfUrl ? (
                        <a href={inf.pdfUrl} className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                          <Download size={13} /> Descargar
                        </a>
                      ) : (
                        <span className="text-xs text-ink/35">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
