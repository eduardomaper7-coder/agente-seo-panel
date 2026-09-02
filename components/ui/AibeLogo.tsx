/* eslint-disable @next/next/no-img-element */
// Marca de Aibe Technologies — el logotipo oficial tal cual (public/brand/
// aibe-logo.png), siempre a color, en cualquier fondo. Componente
// compartido entre el AppShell del panel y las pantallas de acceso para
// que la identidad visual sea una sola. Proporción real del archivo:
// 1038×427 (≈2.43:1).
const ASPECT_RATIO = 1038 / 427;

export function AibeLogo({ size = 32 }: { size?: number; dark?: boolean }) {
  const height = size * 1.15;
  const width = height * ASPECT_RATIO;

  return (
    <img
      src="/brand/aibe-logo.png"
      alt="Aibe Technologies"
      width={Math.round(width)}
      height={Math.round(height)}
      className="shrink-0"
      style={{ height, width: "auto" }}
    />
  );
}
