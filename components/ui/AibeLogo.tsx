/* eslint-disable @next/next/no-img-element */
// Marca de Aibe Technologies — el logotipo oficial (public/brand), en color
// para fondos claros y en blanco (misma imagen, silueta recoloreada) para
// el panel oscuro del login. Componente compartido entre el AppShell del
// panel y las pantallas de acceso para que la identidad visual sea una
// sola. Proporción real del archivo: 1038×427 (≈2.43:1).
const ASPECT_RATIO = 1038 / 427;

export function AibeLogo({ size = 20, dark = false }: { size?: number; dark?: boolean }) {
  const height = size * 1.15;
  const width = height * ASPECT_RATIO;

  return (
    <img
      src={dark ? "/brand/aibe-logo-white.png" : "/brand/aibe-logo.png"}
      alt="Aibe Technologies"
      width={Math.round(width)}
      height={Math.round(height)}
      className="shrink-0"
      style={{ height, width: "auto" }}
    />
  );
}
