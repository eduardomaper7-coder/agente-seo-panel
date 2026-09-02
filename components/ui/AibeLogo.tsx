// Marca de Aibe Technologies en vectores (mismo triángulo que en el PDF de
// informes, ver lib/informes-pdf.ts) — cero dependencia de un archivo de
// imagen. Componente compartido entre el AppShell del panel y las pantallas
// de acceso (login/registro) para que la identidad visual sea una sola.
export function AibeLogo({ size = 20, dark = false }: { size?: number; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
        <path d="M12 2 L22 20 L16.5 20 L12 11.5 L7.5 20 L2 20 Z" fill={dark ? "#FFFFFF" : "#124FC4"} />
      </svg>
      <div className="leading-none">
        <p className={`font-semibold ${dark ? "text-white" : "text-ink"}`} style={{ fontSize: size * 0.65 }}>
          Aibe
        </p>
        <p
          className={`uppercase tracking-wider ${dark ? "text-white/50" : "text-ink/40"}`}
          style={{ fontSize: size * 0.45 }}
        >
          Technologies
        </p>
      </div>
    </div>
  );
}
