import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { Card } from "./Card";
import { Tooltip } from "./Tooltip";

// Tarjeta de KPI compacta para la fila de métricas del Resumen y de Plan SEO.
export function StatCard({
  label,
  value,
  icon: Icon,
  tooltip,
  trend,
}: {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  tooltip?: string;
  trend?: ReactNode;
}) {
  return (
    <Card className="min-w-[150px] flex-1 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-ink/45">
          {tooltip ? <Tooltip text={tooltip}>{label}</Tooltip> : label}
        </span>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
            <Icon size={15} strokeWidth={2} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums text-ink">{value}</span>
        {trend}
      </div>
    </Card>
  );
}
