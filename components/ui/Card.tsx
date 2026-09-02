import { HTMLAttributes } from "react";

// Contenedor base reutilizado por todo el panel: borde fino, esquinas
// suaves y sombra casi imperceptible — la unidad visual mínima del sistema.
export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-aibe border border-ink/10 bg-white shadow-aibe ${className}`}
      {...props}
    />
  );
}

export function CardBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-5 ${className}`} {...props} />;
}
