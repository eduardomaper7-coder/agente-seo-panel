import type { Config } from "tailwindcss";

// Paleta unificada con la marca de Aibe Technologies — los mismos valores
// que ya se usan para dibujar el logo y los encabezados en los informes PDF
// (ver lib/informes-pdf.ts: AZUL_AIBE, AZUL_OSCURO, GRIS, VERDE, ROJO), así
// el panel web y los PDF se perciben como el mismo producto.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0B1B3A", // azul marino oscuro — títulos y texto principal
        paper: "#F5F8FC", // gris/azul extremadamente claro — fondo de página
        accent: "#124FC4", // azul Aibe — color principal de marca
        success: "#1F9D63", // verde — mejoras y estados positivos
        danger: "#D2483B", // rojo — caídas y errores, uso restringido
        warn: "#B45309", // ámbar — avisos
      },
      borderRadius: {
        aibe: "12px",
      },
      boxShadow: {
        aibe: "0 1px 2px 0 rgb(11 27 58 / 0.04), 0 1px 3px 0 rgb(11 27 58 / 0.06)",
        "aibe-md": "0 4px 12px -2px rgb(11 27 58 / 0.08), 0 2px 4px -2px rgb(11 27 58 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
