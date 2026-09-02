import { ReactNode } from "react";

export type BadgeTone = "brand" | "success" | "success-soft" | "info" | "warn" | "danger" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  brand: "bg-accent text-white",
  success: "bg-success text-white",
  "success-soft": "bg-success/10 text-success",
  info: "bg-accent/10 text-accent",
  warn: "bg-warn/10 text-warn",
  danger: "bg-danger/10 text-danger",
  neutral: "bg-ink/[0.06] text-ink/50",
};

// Insignia compacta reutilizada para estados, categorías y posiciones.
// Deliberadamente solo 7 tonos — evitar que el panel se convierta en un
// arcoíris de colores sin significado.
export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
