import { FileText, LayoutGrid, ListChecks, Radar, TrendingUp } from "lucide-react";

// Única fuente de verdad para la navegación del panel de cliente — la usan
// tanto el sidebar de escritorio como el menú móvil.
export const NAV_ITEMS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutGrid },
  { href: "/dashboard/palabras-clave", label: "Palabras clave", icon: TrendingUp },
  { href: "/dashboard/competidores", label: "Competidores", icon: Radar },
  { href: "/dashboard/plan", label: "Plan SEO", icon: ListChecks },
  { href: "/dashboard/informes", label: "Informes", icon: FileText },
] as const;
