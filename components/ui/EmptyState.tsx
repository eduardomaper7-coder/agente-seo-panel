import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

// Estado vacío compacto y honesto — nunca un hueco enorme en blanco.
// Se usa siempre que una sección todavía no tiene datos reales que mostrar.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-aibe border border-dashed border-ink/15 bg-white/60 px-6 py-10 text-center">
      <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05] text-ink/40">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink/50">{description}</p>}
      {action}
    </div>
  );
}
